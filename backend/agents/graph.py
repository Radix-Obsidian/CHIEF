"""LangGraph 4-node pipeline with dynamic interrupt for human-in-the-loop.

Graph flow:
  START → Gatekeeper → [conditional] → Oracle → Scribe → Operator → END
                          └── score < threshold ─────────────────────→ END

Scribe uses dynamic interrupt() to pause for human approval.  High-confidence
drafts with auto_draft enabled skip the interrupt entirely.
Human approves/rejects via Command(resume={approved, user_edits}).
Operator executes the decision (send or archive).

Checkpointed with PostgresSaver backed by Supabase Postgres.
"""

import logging
import os
from functools import lru_cache

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.postgres import PostgresSaver

from agents.state import EmailState
from agents.gatekeeper import gatekeeper_node
from agents.oracle import oracle_node
from agents.scribe import scribe_node
from agents.operator import operator_node
from core.config import SUPABASE_DB_URL, setup_tracing

log = logging.getLogger("chief.graph")

# Setup tracing on module load
setup_tracing()


def _should_draft_router(state: EmailState) -> str:
    """Route based on Gatekeeper's should_draft decision."""
    if state.get("should_draft", False):
        return "oracle"
    return END


def build_chief_graph() -> StateGraph:
    """Build the 4-node CHIEF pipeline graph."""
    builder = StateGraph(EmailState)

    # Add nodes
    builder.add_node("gatekeeper", gatekeeper_node)
    builder.add_node("oracle", oracle_node)
    builder.add_node("scribe", scribe_node)
    builder.add_node("operator", operator_node)

    # Entry point
    builder.add_edge(START, "gatekeeper")

    # Conditional: only draft for emails above user's threshold
    builder.add_conditional_edges(
        "gatekeeper",
        _should_draft_router,
        {"oracle": "oracle", END: END},
    )

    # Linear flow: Oracle → Scribe → Operator → END
    # Scribe self-interrupts via interrupt() when human review is needed
    builder.add_edge("oracle", "scribe")
    builder.add_edge("scribe", "operator")
    builder.add_edge("operator", END)

    return builder


@lru_cache(maxsize=1)
def get_chief_graph():
    """Get the compiled CHIEF graph with checkpointer.

    Uses PostgresSaver backed by Supabase Postgres for durable state.
    Scribe node self-interrupts via dynamic interrupt() when human review
    is needed.  No graph-level interrupt_after — the node decides.
    """
    builder = build_chief_graph()

    db_url = SUPABASE_DB_URL
    if not db_url:
        log.warning("SUPABASE_DB_URL not set, using in-memory checkpointer")
        from langgraph.checkpoint.memory import MemorySaver
        checkpointer = MemorySaver()
    else:
        checkpointer = PostgresSaver.from_conn_string(db_url)
        checkpointer.setup()  # Create checkpoint tables if they don't exist

    graph = builder.compile(checkpointer=checkpointer)

    log.info("CHIEF graph compiled with dynamic interrupt (Scribe self-interrupts)")
    return graph

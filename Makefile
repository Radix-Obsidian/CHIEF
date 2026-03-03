.PHONY: dev stop capture

# Start both backend + frontend in one command
dev:
	@./start-chief.command

# Docker alternative
docker:
	docker compose up

# Stop all CHIEF processes
stop:
	@-pkill -f "uvicorn main:app" 2>/dev/null || true
	@-pkill -f "next dev" 2>/dev/null || true
	@echo "Stopped."

# Capture screenshots + GIF (servers must be running)
capture:
	cd frontend && pnpm exec playwright test --reporter=list
	@cd docs/assets/screenshots && \
		WEBM=$$(ls -t *.webm 2>/dev/null | head -1) && \
		[ -n "$$WEBM" ] && mv "$$WEBM" swipe-flow.webm && \
		ffmpeg -y -i swipe-flow.webm -vf "fps=15,scale=390:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 swipe-flow.gif 2>/dev/null && \
		echo "GIF saved: docs/assets/screenshots/swipe-flow.gif" || true

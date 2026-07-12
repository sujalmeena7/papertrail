@echo off
set ANTHROPIC_API_KEY=
set ANTHROPIC_BASE_URL=http://127.0.0.1:4000
set ANTHROPIC_AUTH_TOKEN=sk-dummy-key
echo Starting Claude Code through LiteLLM Proxy...
echo ---------------------------------------------
claude %*

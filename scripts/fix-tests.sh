#!/usr/bin/env bash
set -euo pipefail

unset CLAUDECODE

# Load .env if present
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

MAX_ATTEMPTS=3
TEST_FILE="tests/app.spec.ts"
APP_FILE="src/App.tsx"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if ! command -v claude &> /dev/null; then
  echo "Error: 'claude' CLI not found. Install Claude Code first."
  exit 1
fi

report_errors() {
  local output="$1"
  # Extract failed test names and error messages from Playwright output
  echo "$output" | grep -E '^\s+\d+\)' | while read -r line; do
    test_name=$(echo "$line" | sed 's/^[[:space:]]*[0-9]*)[[:space:]]*//' | sed 's/[[:space:]]*─*$//')
    error_msg=$(echo "$output" | grep -A 2 "Error:" | head -3 | tr '\n' ' ')
    if [ -n "$test_name" ] && [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_ANON_KEY" ]; then
      node "$SCRIPT_DIR/report-error.mjs" "$test_name" "$error_msg" 2>&1 || echo "Warning: failed to report error to Supabase"
    fi
  done
}

for ((attempt=1; attempt<=MAX_ATTEMPTS; attempt++)); do
  echo "=== Attempt $attempt/$MAX_ATTEMPTS ==="

  if test_output=$(npx playwright test --reporter=list 2>&1); then
    echo "$test_output"
    echo "All tests passed!"
    exit 0
  fi

  echo "$test_output"
  echo ""

  # Report errors to Supabase
  report_errors "$test_output"

  echo "Tests failed. Asking Claude to fix..."

  test_source=$(cat "$TEST_FILE")
  app_source=$(cat "$APP_FILE")

  prompt="The following Playwright tests are failing. Fix the test file so all tests pass.

## Playwright Error Output
$test_output

## Current Test File ($TEST_FILE)
$test_source

## Application Source ($APP_FILE)
$app_source

Output ONLY the complete corrected contents of $TEST_FILE.
Do not include markdown code fences. Do not include explanations."

  fixed=$(echo "$prompt" | claude -p --output-format text)
  echo "$fixed" > "$TEST_FILE"
  echo "Test file updated. Re-running tests..."
  echo ""
done

echo "Failed to fix tests after $MAX_ATTEMPTS attempts."
exit 1

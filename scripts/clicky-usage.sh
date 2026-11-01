#!/bin/bash

# scripts/clicky-usage.sh
# Read and display Clicky API usage statistics

if [ -z "$ADMIN_KEY" ]; then
  echo "Error: ADMIN_KEY environment variable not set"
  exit 1
fi

URL="${1:-https://raise-dead.pages.dev/api/clicky/usage}"

response=$(curl -s -H "X-Admin-Key: $ADMIN_KEY" "$URL")

if [ $? -ne 0 ]; then
  echo "Error: Failed to fetch usage data"
  exit 1
fi

echo "Clicky Usage (last 14 days)"
echo "=========================="
echo ""
echo "Day        Requests  OK  Errors  Denied  Blocked  Prompt  Completion  Estimated"
echo "─────────────────────────────────────────────────────────────────────────────"

echo "$response" | python3 << 'EOF'
import sys, json
try:
    data = json.load(sys.stdin)
    for row in data:
        print(f"{row['day']}  {row['requests']:>8} {row['ok']:>3} {row['errors']:>6} {row['denied']:>6} {row['blocked']:>7} {row['prompt_tokens']:>6} {row['completion_tokens']:>11} ${row['estimated_usd']:.6f}")
except:
    sys.exit(1)
EOF

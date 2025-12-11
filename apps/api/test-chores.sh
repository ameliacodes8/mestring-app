#!/bin/bash

# Get a valid JWT token from your Supabase session
# You'll need to replace TOKEN with an actual auth token from your frontend
TOKEN="YOUR_SUPABASE_JWT_TOKEN_HERE"
BASE_URL="http://localhost:3001"

echo "=== Step 1: Create a weekly template ==="
TEMPLATE=$(curl -s -X POST "$BASE_URL/chore-templates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "familyId": "demo-family",
    "title": "Vacuum top floor",
    "description": "Whole top floor",
    "points": 2,
    "recurrence": "weekly",
    "interval": 1,
    "daysOfWeek": ["SA"],
    "defaultAssignedTo": "child-1",
    "createdBy": "demo-parent"
  }')

echo $TEMPLATE | jq .
TEMPLATE_ID=$(echo $TEMPLATE | jq -r '.id')
echo "Template ID: $TEMPLATE_ID"

echo -e "\n=== Step 2: Generate today's instances ==="
GENERATE=$(curl -s -X POST "$BASE_URL/chore-instances/generate-today" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "familyId": "demo-family"
  }')

echo $GENERATE | jq .

echo -e "\n=== Step 3: List instances ==="
curl -s "$BASE_URL/chore-instances?familyId=demo-family" \
  -H "Authorization: Bearer $TOKEN" | jq .

INSTANCE_ID=$(curl -s "$BASE_URL/chore-instances?familyId=demo-family" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')

if [ "$INSTANCE_ID" != "null" ]; then
  echo -e "\n=== Step 4: Child completes instance ==="
  curl -s -X POST "$BASE_URL/chore-instances/$INSTANCE_ID/complete" \
    -H "Authorization: Bearer $TOKEN" | jq .

  echo -e "\n=== Step 5: Parent approves ==="
  curl -s -X POST "$BASE_URL/chore-instances/$INSTANCE_ID/approve" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"parentId": "demo-parent"}' | jq .
fi

echo -e "\n=== Done! ==="

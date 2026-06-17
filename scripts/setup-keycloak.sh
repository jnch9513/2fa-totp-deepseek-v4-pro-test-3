#!/bin/bash
set -e

KC_URL="http://localhost:8080"
ADMIN_USER="admin"
ADMIN_PASS="admin"
REALM="demo-realm"

echo "Waiting for Keycloak to be ready..."
until curl -sf "$KC_URL/health/ready" > /dev/null 2>&1; do
  echo "  Keycloak not ready yet, retrying in 3s..."
  sleep 3
done
echo "Keycloak is ready!"

echo "Getting admin token..."
ADMIN_TOKEN=$(curl -sf -X POST "$KC_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=admin-cli" \
  -d "username=$ADMIN_USER" \
  -d "password=$ADMIN_PASS" \
  -d "grant_type=password" | jq -r '.access_token')

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
  echo "ERROR: Failed to get admin token"
  exit 1
fi
echo "Admin token obtained."

echo "Creating test user in realm: $REALM..."
curl -sf -X POST "$KC_URL/admin/realms/$REALM/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "enabled": true,
    "emailVerified": true,
    "firstName": "Test",
    "lastName": "User",
    "email": "testuser@example.com",
    "requiredActions": ["CONFIGURE_TOTP"],
    "credentials": [{
      "type": "password",
      "value": "password",
      "temporary": false
    }]
  }'

if [ $? -eq 0 ]; then
  echo "Test user 'testuser' created successfully!"
  echo "  Username: testuser"
  echo "  Password: password"
  echo "  Required Action: CONFIGURE_TOTP (6-digit)"
else
  echo "ERROR: Failed to create test user"
  exit 1
fi

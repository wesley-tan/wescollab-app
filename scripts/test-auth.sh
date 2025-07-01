#!/bin/bash

# Function to test sign-in with a specific email
test_signin() {
    local email=$1
    local name=$2
    echo "Testing sign-in with email: $email"
    
    # Use curl to simulate the OAuth callback
    response=$(curl -s -w "%{http_code}" "http://localhost:3000/auth/callback" \
        -H "Content-Type: application/json" \
        -d "{
            \"code\": \"test_code\",
            \"email\": \"$email\",
            \"name\": \"$name\",
            \"picture\": \"https://example.com/avatar.jpg\"
        }")
    
    status_code=${response: -3}
    response_body=${response:0:${#response}-3}
    
    if [[ $status_code == "200" || $status_code == "302" ]]; then
        echo "✅ Sign-in successful with $email"
        return 0
    else
        echo "❌ Sign-in failed with $email"
        echo "Status code: $status_code"
        echo "Response: $response_body"
        return 1
    fi
}

# Function to run Cypress tests
run_cypress_tests() {
    echo "Running Cypress tests..."
    npx cypress run --spec "cypress/e2e/auth.cy.ts"
}

# Main test sequence
echo "Starting authentication tests..."

# Test various email domains
test_cases=(
    "test@gmail.com:Gmail User"
    "test@yahoo.com:Yahoo User"
    "test@outlook.com:Outlook User"
    "test@wesleyan.edu:Wesleyan User"
)

failed_tests=0

for test_case in "${test_cases[@]}"; do
    IFS=':' read -r email name <<< "$test_case"
    if ! test_signin "$email" "$name"; then
        ((failed_tests++))
    fi
    # Add a small delay between tests
    sleep 2
done

# Run Cypress tests
if ! run_cypress_tests; then
    ((failed_tests++))
fi

# Summary
echo -e "\nTest Summary:"
if [ $failed_tests -eq 0 ]; then
    echo "✅ All tests passed!"
    exit 0
else
    echo "❌ $failed_tests test(s) failed"
    exit 1
fi 
# Test User Credentials

This document contains sample user credentials for testing the password system.

## Sample User Credentials

| User ID | Password |
|---------|----------|
| 1       | 3847     |
| 2       | 9172     |
| 3       | 5639     |
| 4       | 2850     |
| 5       | 7431     |
| 10      | 0543     |
| 25      | 4701     |
| 50      | 7614     |
| 75      | 8162     |
| 100     | 6537     |

## How to Test

1. Go to http://localhost:3000/test
2. Enter a User ID (1-100)
3. Enter the corresponding 4-digit password
4. Click "Start Testing"

## Password System Features

- Each user (1-100) has a unique 4-digit password
- Passwords are stored in CSV format in `user_passwords.csv`
- The system validates both user ID and password before allowing access
- Invalid credentials will show an error message
- Navigation buttons to other pages have been removed as requested

## CSV Format

The passwords are stored in a simple CSV file with the following structure:
```csv
user_id,password
1,3847
2,9172
...
```

## Security Notes

- Passwords are stored in plain text in the `user_passwords.csv` file
- CSV format makes it easy to edit passwords externally if needed
- In production, consider hashing passwords for better security
- Sessions are used to maintain authentication state
- Direct URL access to user pages is currently allowed but could be restricted if needed

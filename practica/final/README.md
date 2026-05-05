# Bash test commands
#### Sign up
```bash
curl -s -X POST http://localhost:3000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ejemplo.com","password":"Password123!"}' | jq
```

#### Validate email
```bash
curl -s -X PUT http://localhost:3000/api/user/validation \
  -H "Authorization: Bearer <TU_TOKEN_DE_REGISTRO>" \
  -H "Content-Type: application/json" \
  -d '{"code":"123456"}' | jq
```

#### Login
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ejemplo.com","password":"Password123!"}' | jq -r '.accessToken')
echo $TOKEN
```

#### Update personal data
```bash
curl -s -X PUT http://localhost:3000/api/user/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan","lastName":"Pérez","nif":"12345678Z"}' | jq
```

#### Complete onboarding
```bash
curl -s -X PATCH http://localhost:3000/api/user/company \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isFreelance": false,
    "name": "Bildy Tech S.L.",
    "cif": "B12345678",
    "address": {
      "street": "Calle Mayor",
      "number": "10",
      "postal": "28001",
      "city": "Madrid",
      "province": "Madrid"
    }
  }' | jq
```

#### Upload company logo
```bash
curl -s -X PATCH http://localhost:3000/api/user/logo \
  -H "Authorization: Bearer $TOKEN" \
  -F "logo=@<logo.jpg>" | jq   
```

#### See user profile
```bash
curl -s -X GET http://localhost:3000/api/user \
  -H "Authorization: Bearer $TOKEN" | jq
```

#### Refresh token
```bash
curl -s -X POST http://localhost:3000/api/user/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<TU_REFRESH_TOKEN>"}' | jq
```
#### Change password
```bash
curl -s -X PUT http://localhost:3000/api/user/password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"Password123!","newPassword":"NewPassword456!"}' | jq
```

#### Logout
```bash
curl -s -X POST http://localhost:3000/api/user/logout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<TU_REFRESH_TOKEN>"}' | jq```

#### Send invite
(admin role required)
```bash
curl -s -X POST http://localhost:3000/api/user/invite \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"companero@ejemplo.com","name":"Carlos"}' | jq
```

#### soft delete user
```bash
curl -s -X DELETE "http://localhost:3000/api/user?soft=true" \
  -H "Authorization: Bearer $TOKEN" | jq
```

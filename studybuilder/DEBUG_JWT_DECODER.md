# Debug JWT Decoder

## Quick Manual Check

Open browser console and run this after logging in:

```javascript
// Get the custom token from localStorage
const customToken = localStorage.getItem('pb_custom_token')
console.log('Custom Token:', customToken)

// Manually decode it
if (customToken) {
  const parts = customToken.split('.')
  console.log('Token has', parts.length, 'parts (should be 3)')
  
  // Decode payload (part 2)
  let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
  const padding = base64.length % 4
  if (padding) base64 += '='.repeat(4 - padding)
  
  const payload = atob(base64)
  console.log('Decoded payload string:', payload)
  
  const payloadObj = JSON.parse(payload)
  console.log('Decoded payload object:', payloadObj)
  console.log('Roles field:', payloadObj.roles)
  console.log('Roles is array?', Array.isArray(payloadObj.roles))
  console.log('Roles length:', payloadObj.roles?.length)
}
```

## Check User Data

```javascript
// Check what's stored in localStorage
const userData = localStorage.getItem('pb_user_data')
if (userData) {
  const user = JSON.parse(userData)
  console.log('Stored user data:', user)
  console.log('User roles field:', user.roles)
}
```

## Using the Composable

```javascript
// Import and use the functions
import { getCustomTokenPayload, getRoles, getCurrentUser } from '@/composables/useAuth'

// Get decoded payload
const payload = getCustomTokenPayload()
console.log('Payload:', payload)
console.log('Payload roles:', payload?.roles)

// Get roles
const roles = getRoles()
console.log('getRoles() result:', roles)

// Get current user
const user = getCurrentUser()
console.log('Current user:', user)
console.log('Current user roles:', user?.roles)
```

## Expected Result

After successful login with `user1@abc.com`, you should see:

```javascript
{
  "collectionId": "_pb_users_auth_",
  "exp": 1762952499,
  "id": "2vt3apeck5mqa96",
  "refreshable": true,
  "type": "auth",
  "roles": ["Study.Read", "Library.Write", "Library.Read"],  // ← Should be here!
  "name": "User One",
  "email": "user1@abc.com",
  "role": 0,
  "iat": 1731067299
}
```

## Common Issues

### Issue 1: Roles is Empty Array `[]`

**Cause:** User record in PocketBase doesn't have roles field or it's empty

**Check:**
```javascript
const userData = JSON.parse(localStorage.getItem('pb_user_data'))
console.log('User roles from PocketBase:', userData.roles)
```

**Solution:** Add roles to the user in PocketBase admin panel

### Issue 2: Roles Field Missing Completely

**Cause:** JWT encoding/decoding issue

**Check:**
```javascript
// Check if roles are being added to the payload
const customToken = localStorage.getItem('pb_custom_token')
const parts = customToken.split('.')
const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
console.log('Raw payload string:', payload)
```

**Look for:** The string should contain `"roles":[...]`

### Issue 3: Cannot Read Property 'roles'

**Cause:** Token decoding failed

**Check:**
```javascript
import { decodeToken } from '@/composables/useAuth'
const customToken = localStorage.getItem('pb_custom_token')
console.log('Token:', customToken)
console.log('Decoded:', decodeToken(customToken))
```

## PocketBase User Record Check

Your PocketBase API response should look like:

```json
{
  "record": {
    "avatar": "",
    "collectionId": "_pb_users_auth_",
    "collectionName": "users",
    "created": "2025-11-05 12:05:50.795Z",
    "email": "user1@abc.com",
    "emailVisibility": true,
    "id": "2vt3apeck5mqa96",
    "name": "User One",
    "role": 0,
    "roles": [                           // ← This field must exist!
      "Study.Read",
      "Library.Write",
      "Library.Read"
    ],
    "updated": "2025-11-05 12:27:15.468Z",
    "verified": true
  },
  "token": "eyJhbGci..."
}
```

**If the `roles` field is missing from the PocketBase response, that's the issue!**

## Verify in PocketBase Admin

1. Go to PocketBase admin: `http://127.0.0.1:8090/_/`
2. Navigate to Collections → users
3. Click on your user record
4. Check if `roles` field exists and has values
5. If not, add the field or populate it with values

Example roles field value:
```json
["Study.Read", "Library.Write", "Library.Read"]
```


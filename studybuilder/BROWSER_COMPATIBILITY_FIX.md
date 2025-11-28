# Browser Compatibility Fix

## Problem

The `jsonwebtoken` library is a **Node.js library** that uses Node.js-specific modules (`util`, `crypto`, `stream`, etc.) which are not available in browser environments.

**Error encountered:**
```
Module "util" has been externalized for browser compatibility. 
Cannot access "util.inherits" in client code.
```

---

## Solution

Replaced the `jsonwebtoken` library with a **browser-native implementation** using built-in JavaScript APIs:

- ✅ `btoa()` / `atob()` for base64 encoding/decoding
- ✅ `JSON.stringify()` / `JSON.parse()` for payload handling
- ✅ No external dependencies required

---

## What Changed

### Before (Node.js Library)

```javascript
import jwt from 'jsonwebtoken'

// Decode token
const payload = jwt.decode(token)

// Sign token
const newToken = jwt.sign(payload, secret)
```

### After (Browser-Native)

```javascript
// Base64 URL encoding/decoding
function base64UrlEncode(str) {
  const base64 = btoa(str)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padding = base64.length % 4
  if (padding) base64 += '='.repeat(4 - padding)
  return atob(base64)
}

// Decode JWT token
function decodeToken(token) {
  const parts = token.split('.')
  const payload = base64UrlDecode(parts[1])
  return JSON.parse(payload)
}

// Create custom JWT token
function createCustomToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const headerEncoded = base64UrlEncode(JSON.stringify(header))
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload))
  const signature = base64UrlEncode('client-side-signature')
  
  return `${headerEncoded}.${payloadEncoded}.${signature}`
}
```

---

## Key Points

### ✅ Advantages

1. **No external dependencies** - Uses only browser APIs
2. **No installation required** - Works out of the box
3. **No compatibility issues** - Pure JavaScript, runs anywhere
4. **Smaller bundle size** - No external library to bundle

### ⚠️ Important Notes

1. **Client-side JWT is NOT cryptographically secure**
   - The signature is a placeholder (not verified)
   - Never use for server authentication
   - Only for client-side UI/authorization

2. **Original PocketBase JWT remains secure**
   - Used for all API calls
   - Server-validated by PocketBase
   - This is your secure authentication token

3. **Custom JWT purpose**
   - ✅ Store roles in accessible format
   - ✅ Client-side authorization checks
   - ✅ UI conditional rendering
   - ❌ NOT for API authentication
   - ❌ NOT for security validation

---

## How It Works

### JWT Structure

A JWT has three parts: `header.payload.signature`

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9  ← Header (base64url encoded)
.
eyJpZCI6IjJ2dDNhcGVjazVtcWE5NiIsInJvbGVzIjpbIlN0dWR5LlJlYWQiXX0  ← Payload (base64url encoded)
.
Y2xpZW50LXNpZGUtc2lnbmF0dXJl  ← Signature (placeholder)
```

### Decoding

1. Split token by `.` to get three parts
2. Take the middle part (payload)
3. Base64 URL decode it
4. Parse JSON

```javascript
const parts = token.split('.')           // ['header', 'payload', 'signature']
const payload = base64UrlDecode(parts[1]) // '{"id":"...","roles":[...]}'
const data = JSON.parse(payload)          // { id: "...", roles: [...] }
```

### Encoding

1. Create header object
2. Create payload object with roles
3. Base64 URL encode both
4. Add placeholder signature
5. Join with `.`

```javascript
const header = { alg: 'HS256', typ: 'JWT' }
const payload = { id: '123', roles: ['Study.Read'] }

const headerB64 = base64UrlEncode(JSON.stringify(header))
const payloadB64 = base64UrlEncode(JSON.stringify(payload))
const signature = base64UrlEncode('client-side-signature')

const token = `${headerB64}.${payloadB64}.${signature}`
```

---

## Testing

### Browser Console Test

After logging in:

```javascript
// Check the custom token
const customToken = localStorage.getItem('pb_custom_token')
console.log('Custom Token:', customToken)

// Decode it manually
const parts = customToken.split('.')
const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
console.log('Decoded:', JSON.parse(payload))
```

Expected output:
```javascript
{
  "collectionId": "_pb_users_auth_",
  "exp": 1762952499,
  "id": "2vt3apeck5mqa96",
  "refreshable": true,
  "type": "auth",
  "roles": ["Study.Read", "Library.Write", "Library.Read"],
  "name": "User One",
  "email": "user1@abc.com",
  "role": 0,
  "iat": 1731067299
}
```

---

## Files Modified

- ✅ `src/composables/useAuth.js` - Replaced `jsonwebtoken` with browser-native implementation
- ✅ `SETUP_INSTRUCTIONS.md` - Removed installation instructions
- ✅ `QUICK_REFERENCE.md` - Updated to reflect no dependencies
- ✅ `README_AUTH.md` - Removed installation section
- ✅ `IMPLEMENTATION_SUMMARY.md` - Updated next steps
- ✅ `USAGE_EXAMPLES.md` - Removed installation requirement

---

## Browser Compatibility

Works in all modern browsers that support:

- ✅ `btoa()` / `atob()` - Available since IE10+
- ✅ `JSON.stringify()` / `JSON.parse()` - Available since IE8+
- ✅ ES6 features (arrow functions, const/let) - Modern browsers

---

## Migration Notes

### If You Had Installed `jsonwebtoken`

You can optionally remove it:

```bash
npm uninstall jsonwebtoken
```

But it won't cause issues if you leave it (it's just not used anymore).

---

## Security Comparison

### Original PocketBase JWT (Secure ✅)

```javascript
// Created by PocketBase server
// Signed with server-side secret
// Verified on every API call
// Cannot be modified without invalidation
✅ Use for API authentication
```

### Custom Client-Side JWT (UI Only ⚠️)

```javascript
// Created in browser
// Signed with placeholder (not verified)
// Can be modified by user in localStorage
// Only affects UI visibility
✅ Use for UI/role checks
❌ Never use for API authentication
```

---

## Example: Full Flow

### 1. User logs in

```javascript
const result = await login('user@example.com', 'password')
```

### 2. PocketBase returns token + user record

```javascript
{
  token: "eyJhbGci...",  // Original PocketBase JWT
  record: {
    id: "2vt3apeck5mqa96",
    roles: ["Study.Read", "Library.Write"]
  }
}
```

### 3. We decode original token

```javascript
const originalPayload = decodeToken(pocketbaseToken)
// { id: "2vt3apeck5mqa96", exp: 1762952499, ... }
```

### 4. We create custom token with roles

```javascript
const customPayload = {
  ...originalPayload,
  roles: ["Study.Read", "Library.Write"],  // ← Added!
  name: "User One",
  email: "user@example.com"
}
const customToken = createCustomToken(customPayload)
```

### 5. We store both tokens

```javascript
localStorage.setItem('pb_original_token', pocketbaseToken)  // For API calls
localStorage.setItem('pb_custom_token', customToken)        // For UI/roles
```

### 6. Use them appropriately

```javascript
// ✅ API calls - use original token
const token = getOriginalToken()
fetch(url, { headers: { Authorization: `Bearer ${token}` } })

// ✅ UI checks - use custom token
const payload = getCustomTokenPayload()
if (payload.roles.includes('Library.Write')) {
  // Show edit button
}
```

---

## Summary

✅ **Fixed:** Replaced Node.js library with browser-native implementation  
✅ **Result:** No external dependencies needed  
✅ **Works:** Pure JavaScript, runs in all modern browsers  
✅ **Secure:** Original PocketBase token still used for API calls  
✅ **Purpose:** Custom token only for client-side role management  

---

**The application is now fully browser-compatible and ready to use!** 🚀


# What's New - Enhanced API Response

## 🎉 Latest Update

The login response now includes the **custom JWT token with roles** as the primary token in the response!

---

## ✨ What Changed

### Before

```javascript
const result = await login(email, password)

result.customToken    // Custom JWT with roles
result.originalToken  // Original PocketBase JWT
result.data          // Original PocketBase response
```

### After (NOW) ✅

```javascript
const result = await login(email, password)

result.token           // 🆕 Custom JWT with roles (main token!)
result.originalToken   // Original PocketBase JWT (for API calls)
result.record          // 🆕 User record with roles
result.decodedToken    // 🆕 Decoded custom JWT payload
result.userType        // "user" or "admin"
result.data           // Original PocketBase response (for compatibility)
```

---

## 🚀 Benefits

### 1. Cleaner Structure
```javascript
// Access roles directly
const roles = result.decodedToken.roles
// No need to decode manually!
```

### 2. Clear Token Purpose
```javascript
// ✅ For client-side UI and role checks
const uiToken = result.token

// ✅ For API calls to PocketBase
const apiToken = result.originalToken
```

### 3. Instant Access to Decoded Payload
```javascript
// OLD: Had to decode manually
const payload = decodeToken(result.customToken)
const roles = payload.roles

// NEW: Already decoded!
const roles = result.decodedToken.roles
```

---

## 📖 Quick Examples

### Example 1: Simple Role Check

```javascript
const result = await login('user@example.com', 'password')

if (result.success) {
  // Check if user has specific role
  if (result.decodedToken.roles.includes('Library.Write')) {
    console.log('User can edit library!')
  }
  
  // Display all roles
  console.log('User roles:', result.record.roles)
}
```

### Example 2: Component Usage

```vue
<template>
  <div>
    <h2>Welcome, {{ user.name }}!</h2>
    <p>Your roles:</p>
    <ul>
      <li v-for="role in user.roles" :key="role">{{ role }}</li>
    </ul>
  </div>
</template>

<script>
import { login } from '@/composables/useAuth'

export default {
  data() {
    return {
      user: null
    }
  },
  async mounted() {
    const result = await login('user@example.com', 'password')
    
    if (result.success) {
      // Direct access to user data with roles
      this.user = result.record
    }
  }
}
</script>
```

### Example 3: API Call

```javascript
const result = await login('user@example.com', 'password')

// Use original token for API authentication
const response = await fetch('http://127.0.0.1:8090/api/collections/studies/records', {
  headers: {
    'Authorization': `Bearer ${result.originalToken}`
  }
})
```

---

## 🔍 Console Output

After logging in, you'll see detailed output:

```
✅ Authentication successful!

=== ENHANCED API RESPONSE ===
{
  "success": true,
  "token": "eyJhbGci...",        // Custom JWT with roles
  "originalToken": "eyJhbGci...", // PocketBase JWT
  "record": {
    "id": "2vt3apeck5mqa96",
    "email": "user1@abc.com",
    "name": "User One",
    "roles": ["Study.Read", "Library.Write", "Library.Read"]
  },
  "userType": "user"
}

=== TOKEN COMPARISON ===
1️⃣ result.token (Custom JWT with roles):
   🔐 Roles included: ['Study.Read', 'Library.Write', 'Library.Read']
   ✅ Use for: Client-side role checks, UI authorization

2️⃣ result.originalToken (PocketBase JWT):
   ✅ Use for: API calls to PocketBase
   ⚠️  No roles in payload (by design)

=== DECODED CUSTOM JWT PAYLOAD ===
{
  "collectionId": "_pb_users_auth_",
  "exp": 1762952499,
  "id": "2vt3apeck5mqa96",
  "roles": ["Study.Read", "Library.Write", "Library.Read"],  ← HERE!
  "name": "User One",
  "email": "user1@abc.com",
  ...
}
```

---

## 📚 Full Response Structure

```javascript
{
  success: true,
  token: "...",              // Custom JWT with roles
  originalToken: "...",      // Original PocketBase JWT
  record: {                  // User record
    id: "...",
    email: "...",
    name: "...",
    roles: [...],            // ✅ Roles array
    role: 0,
    // ... other fields
  },
  decodedToken: {            // Decoded custom JWT
    id: "...",
    roles: [...],            // ✅ Roles in token payload!
    name: "...",
    email: "...",
    exp: 1234567890,
    // ... other JWT claims
  },
  userType: "user",
  data: {                    // Original PocketBase response
    token: "...",
    record: {...}
  }
}
```

---

## 🎯 What to Use When

| Task | Use This | Example |
|------|----------|---------|
| Check user roles | `result.decodedToken.roles` | `if (result.decodedToken.roles.includes('Admin'))` |
| Display user info | `result.record` | `<p>{{ result.record.name }}</p>` |
| API calls | `result.originalToken` | `headers: { Authorization: Bearer ${result.originalToken} }` |
| Store token | `result.token` | `localStorage.setItem('token', result.token)` |
| Get all roles | `result.record.roles` | `const roles = result.record.roles` |

---

## 🔐 Important Security Notes

### ✅ DO

- **Use `result.originalToken` for API calls** - Server validated by PocketBase
- **Use `result.token` for UI/role checks** - Contains roles for client-side
- **Verify permissions on backend** - Never trust client-side only

### ❌ DON'T

- **Don't use `result.token` for API calls** - It's for client-side only
- **Don't trust client-side role checks for security** - Backend must verify
- **Don't modify tokens** - They're meant to be read-only

---

## 📝 Documentation

For more details, see:
- **`API_RESPONSE_STRUCTURE.md`** - Complete response documentation
- **`DEBUG_JWT_DECODER.md`** - Manual debugging guide
- **`QUICK_REFERENCE.md`** - Quick function reference

---

## ✅ Ready to Test!

1. **Clear localStorage**: `localStorage.clear()`
2. **Refresh your app**
3. **Login with your credentials**
4. **Check browser console** - You'll see the enhanced response!

---

## 🎊 Summary

✅ **`result.token`** now contains your custom JWT with roles  
✅ **`result.decodedToken`** gives you instant access to the payload  
✅ **`result.record`** includes user data with roles  
✅ **`result.originalToken`** is still there for API calls  

**The JWT token now has roles in the payload!** 🚀


# Enhanced API Response Structure

## Overview

The login functions now return an **enhanced response** that mimics the PocketBase API structure but includes the custom JWT token with roles.

---

## Response Structure

### After Successful Login

```javascript
const result = await login('user@example.com', 'password')

// Result structure:
{
  success: true,
  
  // 🆕 Custom JWT token WITH roles (use for client-side)
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQ...",
  
  // Original PocketBase JWT (use for API calls)
  originalToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJ2dDNh...",
  
  // User record with roles
  record: {
    id: "2vt3apeck5mqa96",
    email: "user1@abc.com",
    name: "User One",
    roles: ["Study.Read", "Library.Write", "Library.Read"],  // ✅ Roles included!
    role: 0,
    collectionId: "_pb_users_auth_",
    collectionName: "users",
    // ... other user fields
  },
  
  // User type
  userType: "user",  // or "admin"
  
  // 🆕 Decoded custom token payload (for easy access)
  decodedToken: {
    collectionId: "_pb_users_auth_",
    exp: 1762952499,
    id: "2vt3apeck5mqa96",
    refreshable: true,
    type: "auth",
    roles: ["Study.Read", "Library.Write", "Library.Read"],  // ✅ Roles in JWT!
    name: "User One",
    email: "user1@abc.com",
    role: 0,
    iat: 1731067299
  },
  
  // Original PocketBase response (for compatibility)
  data: {
    token: "...",
    record: { ... }
  }
}
```

---

## Usage Examples

### Example 1: Access Token with Roles

```javascript
import { login } from '@/composables/useAuth'

const result = await login('user@example.com', 'password')

if (result.success) {
  // ✅ Access the custom token (includes roles)
  console.log('Token with roles:', result.token)
  
  // ✅ Access decoded payload directly
  console.log('Roles:', result.decodedToken.roles)
  // Output: ['Study.Read', 'Library.Write', 'Library.Read']
  
  // ✅ Access roles from record
  console.log('User roles:', result.record.roles)
  // Output: ['Study.Read', 'Library.Write', 'Library.Read']
  
  // ✅ Get original token for API calls
  console.log('Original token:', result.originalToken)
}
```

### Example 2: Use in Component

```vue
<script>
import { login } from '@/composables/useAuth'

export default {
  data() {
    return {
      loginResponse: null
    }
  },
  methods: {
    async handleLogin() {
      const result = await login(this.email, this.password)
      
      if (result.success) {
        // Store the response
        this.loginResponse = result
        
        // Access token with roles
        console.log('JWT Token (with roles):', result.token)
        
        // Access roles directly
        console.log('User roles:', result.decodedToken.roles)
        
        // Check specific role
        if (result.decodedToken.roles.includes('Library.Write')) {
          console.log('User can write to library!')
        }
        
        // Use original token for API calls
        this.fetchData(result.originalToken)
      }
    },
    
    async fetchData(token) {
      const response = await fetch('http://127.0.0.1:8090/api/collections/studies/records', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      // ...
    }
  }
}
</script>
```

### Example 3: Store in Vuex/Pinia Store

```javascript
// stores/auth.js
import { defineStore } from 'pinia'
import { login } from '@/composables/useAuth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    loginResponse: null,
    user: null,
    roles: []
  }),
  
  actions: {
    async login(email, password) {
      const result = await login(email, password)
      
      if (result.success) {
        // Store the entire response
        this.loginResponse = result
        
        // Store user info
        this.user = result.record
        
        // Store roles for easy access
        this.roles = result.decodedToken.roles
        
        return result
      }
      
      throw new Error('Login failed')
    }
  },
  
  getters: {
    token: (state) => state.loginResponse?.token,
    originalToken: (state) => state.loginResponse?.originalToken,
    hasRole: (state) => (role) => state.roles.includes(role)
  }
})
```

### Example 4: API Service with Token

```javascript
// services/api.js
import { getOriginalToken } from '@/composables/useAuth'

class ApiService {
  constructor() {
    this.baseUrl = 'http://127.0.0.1:8090/api'
  }
  
  async request(endpoint, options = {}) {
    const token = getOriginalToken()
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
    
    return response.json()
  }
  
  async getStudies() {
    return this.request('/collections/studies/records')
  }
}

export default new ApiService()
```

---

## Response Fields Explained

### `success` (boolean)
- `true` if login successful
- `false` if login failed

### `token` (string) - **NEW!**
- **Custom JWT token with roles in payload**
- Use this for client-side role checks
- Stored in `localStorage` as `pb_custom_token`
- **DO NOT use for API calls to PocketBase**

### `originalToken` (string)
- Original PocketBase JWT token
- **Use this for all API calls to PocketBase**
- Stored in `localStorage` as `pb_original_token`
- Server-validated by PocketBase

### `record` (object)
- User record from PocketBase
- Includes all user fields
- **Includes roles array** for easy access

### `decodedToken` (object) - **NEW!**
- Decoded payload from custom JWT
- Includes all JWT claims + roles
- Easy access without decoding manually

### `userType` (string)
- Either `"user"` or `"admin"`
- Indicates authentication type

### `data` (object)
- Original PocketBase response
- Included for compatibility
- Contains `token` and `record` from PocketBase

---

## Token Comparison

### Custom Token (result.token)

```json
{
  "collectionId": "_pb_users_auth_",
  "exp": 1762952499,
  "id": "2vt3apeck5mqa96",
  "refreshable": true,
  "type": "auth",
  "roles": ["Study.Read", "Library.Write", "Library.Read"],  // ✅ Included!
  "name": "User One",
  "email": "user1@abc.com",
  "role": 0,
  "iat": 1731067299
}
```

**Use for:**
- ✅ Client-side role checks
- ✅ UI conditional rendering
- ✅ Route guards
- ✅ Displaying user permissions

**Do NOT use for:**
- ❌ API authentication
- ❌ Server-side validation

### Original Token (result.originalToken)

```json
{
  "collectionId": "_pb_users_auth_",
  "exp": 1762952499,
  "id": "2vt3apeck5mqa96",
  "refreshable": true,
  "type": "auth"
  // No roles (PocketBase doesn't include them)
}
```

**Use for:**
- ✅ API calls to PocketBase
- ✅ Server authentication

**Do NOT use for:**
- ❌ Client-side role checks (no roles in payload)

---

## Quick Reference

```javascript
// After login
const result = await login(email, password)

// ✅ Get token with roles (for UI)
const tokenWithRoles = result.token
const roles = result.decodedToken.roles

// ✅ Get original token (for API)
const apiToken = result.originalToken

// ✅ Get user info
const user = result.record
const userName = result.record.name
const userEmail = result.record.email
const userRoles = result.record.roles

// ✅ Check role
if (result.decodedToken.roles.includes('Library.Write')) {
  // User can write to library
}
```

---

## Migration from Old Response

If you were using the old response structure, here's the mapping:

```javascript
// OLD
result.customToken  →  result.token          // ✅ Now the main token
result.originalToken →  result.originalToken // ✅ Same
result.data.record  →  result.record         // ✅ More direct access

// NEW
result.decodedToken  // ✅ NEW - decoded payload
```

---

## Console Output Example

After successful login, you'll see:

```
✅ Authentication successful!

=== ENHANCED API RESPONSE ===
Response structure (mimics PocketBase but with custom JWT):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN...",
  "originalToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ij...",
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
   Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQ...
   Decoded: { id: "...", roles: [...], ... }
   ✅ Use for: Client-side role checks, UI authorization
   🔐 Roles included: ['Study.Read', 'Library.Write', 'Library.Read']

2️⃣ result.originalToken (PocketBase JWT):
   Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJ2dDNh...
   ✅ Use for: API calls to PocketBase
   ⚠️  No roles in payload (by design)

=== USER INFO ===
User ID: 2vt3apeck5mqa96
Email: user1@abc.com
Name: User One
Roles: ['Study.Read', 'Library.Write', 'Library.Read']
Type: user

=== DECODED CUSTOM JWT PAYLOAD ===
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

## Summary

✅ **What's New:**
- `result.token` - Custom JWT with roles (main token for client-side)
- `result.decodedToken` - Decoded payload (easy access to roles)
- `result.record` - Direct access to user record with roles

✅ **What to Use:**
- `result.token` - For client-side role checks and UI
- `result.originalToken` - For API calls to PocketBase
- `result.decodedToken.roles` - To check user permissions

✅ **Benefits:**
- Cleaner API response structure
- Direct access to roles without manual decoding
- Clear separation between client and server tokens
- Mimics PocketBase API structure for familiarity


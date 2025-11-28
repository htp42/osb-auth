# Custom JWT Authentication with Roles

Complete authentication solution for StudyBuilder that creates a custom client-side JWT token with user roles from PocketBase.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [Files](#files)
- [Documentation](#documentation)
- [Usage Example](#usage-example)
- [Security](#security)

---

## Overview

This authentication system:
1. Authenticates users with PocketBase
2. Receives original JWT token + user record with roles
3. Creates a **new custom JWT** that includes roles in the payload
4. Stores **both tokens** for different purposes:
   - Original token → API calls to PocketBase
   - Custom token → Client-side authorization

---

## Features

✅ **Dual Token System**
- Original PocketBase JWT for API authentication
- Custom JWT with roles for client-side authorization

✅ **Role-Based Access Control**
- `getRoles()` - Get user roles
- `isAuthorized(role)` - Check if user has role
- `hasAllRoles(roles)` - Check if user has all roles

✅ **Vue 3 Composable**
- Reactive state management
- Easy integration with components
- TypeScript-ready

✅ **Persistent Authentication**
- Auto-restore from localStorage
- Survives page refreshes

✅ **Security Conscious**
- Separate tokens for different purposes
- Original token never exposed unnecessarily
- Client-side JWT for UI only

---

## Quick Start

### 1. No Installation Needed! ✅

This implementation uses **browser-native APIs** (base64). No external dependencies required!

### 2. Login

```javascript
import { login } from '@/composables/useAuth'

const result = await login('user@example.com', 'password')

if (result.success) {
  console.log('Logged in!')
  console.log('Custom JWT:', result.customToken)
  console.log('Roles:', result.data.record.roles)
}
```

### 3. Check Roles

```javascript
import { getRoles, isAuthorized } from '@/composables/useAuth'

const roles = getRoles()
// ['Study.Read', 'Library.Write', 'Library.Read']

if (isAuthorized('Library.Write')) {
  // User can write to library
}
```

### 4. Make API Call

```javascript
import { getOriginalToken } from '@/composables/useAuth'

const token = getOriginalToken()

fetch('http://127.0.0.1:8090/api/collections/studies/records', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│ 1. User Login                                            │
│    email: user@example.com                              │
│    password: ••••••••                                   │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 2. PocketBase Authentication                            │
│    POST /api/collections/users/auth-with-password       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 3. PocketBase Response                                  │
│    {                                                     │
│      token: "eyJhbGci...",                              │
│      record: {                                          │
│        id: "2vt3apeck5mqa96",                           │
│        email: "user@example.com",                       │
│        name: "User One",                                │
│        roles: ["Study.Read", "Library.Write"]           │
│      }                                                   │
│    }                                                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Decode Original JWT                                  │
│    {                                                     │
│      id: "2vt3apeck5mqa96",                             │
│      exp: 1762950471,                                   │
│      type: "auth"                                       │
│      // No roles here!                                  │
│    }                                                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Create Custom JWT (with roles)                      │
│    jwt.sign({                                           │
│      id: "2vt3apeck5mqa96",                             │
│      exp: 1762950471,                                   │
│      type: "auth",                                      │
│      roles: ["Study.Read", "Library.Write"], ← Added!   │
│      name: "User One",                     ← Added!    │
│      email: "user@example.com"             ← Added!    │
│    }, CLIENT_SECRET)                                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Store Both Tokens                                    │
│    localStorage:                                        │
│      pb_original_token: "eyJhbGci..." ← For API calls   │
│      pb_custom_token: "eyJhbGci..."   ← For UI/roles    │
│      pb_user_data: "{...}"                              │
└─────────────────────────────────────────────────────────┘
```

---

## Files

### Created Files

| File | Purpose |
|------|---------|
| `src/composables/useAuth.js` | Main authentication composable |
| `SETUP_INSTRUCTIONS.md` | Complete setup guide |
| `USAGE_EXAMPLES.md` | Full component examples |
| `QUICK_REFERENCE.md` | API quick reference |
| `README_AUTH.md` | This file |

### Modified Files

| File | Changes |
|------|---------|
| `src/views/LoginPage.vue` | Uses new `useAuth` composable |
| `src/main.js` | Imports `restoreAuth` from composable |

---

## Documentation

📚 **Complete Documentation:**

1. **[SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)**
   - Installation guide
   - Architecture explanation
   - API reference
   - Security notes

2. **[USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md)**
   - User profile component
   - Role-based dashboard
   - API service patterns
   - Route guards
   - Admin panel
   - Debug tools

3. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)**
   - Quick API lookup
   - Common patterns
   - Code snippets
   - Debugging tips

---

## Usage Example

### Component with Role Check

```vue
<template>
  <div class="dashboard">
    <h1>Welcome, {{ currentUser?.name }}!</h1>
    
    <!-- Show if user can read studies -->
    <v-card v-if="isAuthorized('Study.Read')">
      <v-card-title>Studies</v-card-title>
      <v-card-text>
        <StudiesList />
      </v-card-text>
    </v-card>
    
    <!-- Show if user can write to library -->
    <v-btn
      v-if="isAuthorized('Library.Write')"
      color="primary"
      @click="editLibrary"
    >
      Edit Library
    </v-btn>
    
    <!-- Show user roles -->
    <div class="mt-4">
      <v-chip
        v-for="role in roles"
        :key="role"
        size="small"
        class="mr-1"
      >
        {{ role }}
      </v-chip>
    </div>
  </div>
</template>

<script>
import { useAuth } from '@/composables/useAuth'

export default {
  setup() {
    const { 
      currentUser,
      roles,
      isAuthorized,
      logout
    } = useAuth()
    
    const editLibrary = () => {
      // Navigate to library editor
    }
    
    return {
      currentUser,
      roles,
      isAuthorized,
      editLibrary,
      logout
    }
  }
}
</script>
```

### API Call with Token

```javascript
import { getOriginalToken } from '@/composables/useAuth'

async function fetchStudies() {
  const token = getOriginalToken()
  
  const response = await fetch(
    'http://127.0.0.1:8090/api/collections/studies/records',
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  )
  
  return response.json()
}
```

### Route Guard

```javascript
import { checkAuth, isAuthorized } from '@/composables/useAuth'

router.beforeEach((to, from, next) => {
  // Check authentication
  if (to.meta.requiresAuth && !checkAuth()) {
    return next({ name: 'Login' })
  }
  
  // Check role
  if (to.meta.requiredRole && !isAuthorized(to.meta.requiredRole)) {
    return next({ name: 'Unauthorized' })
  }
  
  next()
})
```

---

## Security

### ⚠️ Important Security Notes

1. **Two Tokens, Two Purposes**
   ```javascript
   // ✅ CORRECT - Use original token for API calls
   const token = getOriginalToken()
   fetch(url, { headers: { Authorization: `Bearer ${token}` } })
   
   // ❌ WRONG - Don't use custom token for API calls
   const customToken = getCustomToken()
   fetch(url, { headers: { Authorization: `Bearer ${customToken}` } })
   ```

2. **Client-Side JWT is NOT Secure**
   - Signed with client-side secret
   - Can be modified by user in localStorage
   - Only affects UI visibility
   - Backend must still verify permissions

3. **Always Verify on Backend**
   ```javascript
   // PocketBase collection rules
   // List rule for library collection
   @request.auth.id != "" && @request.auth.roles:each ?= "Library.Read"
   
   // Write rule for library collection
   @request.auth.id != "" && @request.auth.roles:each ?= "Library.Write"
   ```

4. **Custom Token Purpose**
   - ✅ UI/UX authorization checks
   - ✅ Conditional rendering
   - ✅ Route guards
   - ✅ Client-side role management
   - ❌ NOT for server authentication
   - ❌ NOT cryptographically secure

---

## Token Comparison

### Before (Original PocketBase JWT)

```json
{
  "collectionId": "_pb_users_auth_",
  "exp": 1762950471,
  "id": "2vt3apeck5mqa96",
  "refreshable": true,
  "type": "auth"
}
```

❌ No roles in token payload

### After (Custom JWT with Roles)

```json
{
  "collectionId": "_pb_users_auth_",
  "exp": 1762950471,
  "id": "2vt3apeck5mqa96",
  "refreshable": true,
  "type": "auth",
  "roles": ["Study.Read", "Library.Write", "Library.Read"],
  "name": "User One",
  "email": "user1@abc.com",
  "role": 0
}
```

✅ Roles included in token payload!

---

## Testing

### After Login

Open browser console:

```javascript
// Check what's stored
console.log(localStorage.getItem('pb_original_token'))
console.log(localStorage.getItem('pb_custom_token'))
console.log(localStorage.getItem('pb_user_data'))

// Test functions
import { getRoles, getCustomTokenPayload, isAuthorized } from '@/composables/useAuth'

console.log('Roles:', getRoles())
console.log('Payload:', getCustomTokenPayload())
console.log('Can write?', isAuthorized('Library.Write'))
```

### Example Console Output

After successful login with `user1@abc.com`:

```
✅ Authentication successful!
User Type: user
User ID: 2vt3apeck5mqa96
User email: user1@abc.com

=== TOKEN DETAILS ===
Original PocketBase Token: eyJhbGci...
Custom JWT Token (with roles): eyJhbGci...

=== CUSTOM JWT PAYLOAD (with roles) ===
{
  "collectionId": "_pb_users_auth_",
  "exp": 1762950471,
  "id": "2vt3apeck5mqa96",
  "refreshable": true,
  "type": "auth",
  "roles": [
    "Study.Read",
    "Library.Write",
    "Library.Read"
  ],
  "name": "User One",
  "email": "user1@abc.com",
  "role": 0,
  "iat": 1731067200
}
Roles: ['Study.Read', 'Library.Write', 'Library.Read']
Name: User One
Email: user1@abc.com
Expires: 11/12/2025, 10:27:51 AM
===========================
```

---

## API Quick Reference

```javascript
// Authentication
login(email, password)           // Login user
adminLogin(email, password)      // Login admin
logout()                         // Logout
checkAuth()                      // Check if authenticated

// Roles
getRoles()                       // Get user roles
isAuthorized(role)               // Has ANY role
hasAllRoles(roles)               // Has ALL roles

// Tokens
getOriginalToken()               // For API calls
getCustomToken()                 // With roles
getCustomTokenPayload()          // Decoded custom token

// User
getCurrentUser()                 // Current user object

// Composable
const { currentUser, roles, isAuthenticated, ... } = useAuth()
```

---

## Next Steps

1. ✅ Install `jsonwebtoken` dependency
2. ✅ Test login with your PocketBase credentials
3. ✅ Check browser console for token details
4. ✅ Update components to use `useAuth` composable
5. ✅ Add route guards with role checking
6. ✅ Create role-specific UI components

---

## Support

- 📖 Read `SETUP_INSTRUCTIONS.md` for detailed setup
- 📝 Check `USAGE_EXAMPLES.md` for component examples
- 🔍 See `QUICK_REFERENCE.md` for API lookup
- 🐛 Debug with browser console and localStorage

---

## License

Part of the StudyBuilder application.

---

**Ready to use!** 🚀

Start by installing `jsonwebtoken` and logging in to see your custom JWT with roles in action.


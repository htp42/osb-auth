# Custom JWT with Roles - Setup Instructions

## Overview

This implementation creates a **custom client-side JWT token** that includes user roles from PocketBase, while maintaining the original PocketBase JWT for API authentication.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Login Flow                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User enters credentials                                 │
│     ↓                                                        │
│  2. Authenticate with PocketBase                            │
│     ↓                                                        │
│  3. Receive PocketBase JWT + User Record (with roles)       │
│     ↓                                                        │
│  4. Decode original JWT payload                             │
│     ↓                                                        │
│  5. Create NEW custom JWT with:                             │
│     - Original JWT claims                                   │
│     - User roles from record                                │
│     - Additional user info (name, email)                    │
│     ↓                                                        │
│  6. Store BOTH tokens in localStorage:                      │
│     - Original JWT → for API calls to PocketBase            │
│     - Custom JWT → for client-side authorization            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Installation

### ✅ No External Dependencies Required!

This implementation uses **browser-native APIs** (base64 encoding/decoding) and doesn't require any external JWT libraries.

Everything works out of the box with just Vue 3 and PocketBase!

### Files Created

- ✅ `src/composables/useAuth.js` - Main authentication composable
- ✅ `src/views/LoginPage.vue` - Updated to use new composable
- ✅ `src/main.js` - Updated to restore auth on app load

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

## Storage Structure

After successful login, localStorage contains:

```javascript
{
  "pb_original_token": "eyJhbGci...",  // Original PocketBase JWT (for API calls)
  "pb_custom_token": "eyJhbGci...",    // Custom JWT with roles (for UI)
  "pb_user_data": "{...}",              // User record as JSON
  "pb_user_type": "user"                // "user" or "admin"
}
```

## Usage

### Basic Authentication

```javascript
import { useAuth } from '@/composables/useAuth'

export default {
  setup() {
    const { 
      login, 
      logout, 
      isAuthenticated, 
      currentUser,
      roles 
    } = useAuth()
    
    return {
      login,
      logout,
      isAuthenticated,
      currentUser,
      roles
    }
  }
}
```

### Login Example

```vue
<script>
import { login, adminLogin } from '@/composables/useAuth'

export default {
  methods: {
    async handleLogin() {
      const result = await login('user@example.com', 'password')
      
      if (result.success) {
        console.log('Original Token:', result.originalToken)
        console.log('Custom Token:', result.customToken)
        // Redirect to dashboard
        this.$router.push('/dashboard')
      } else {
        console.error('Login failed:', result.error)
      }
    }
  }
}
</script>
```

### Role-Based Access Control

```vue
<template>
  <div>
    <h1>Dashboard</h1>
    
    <!-- Show only if user has specific role -->
    <div v-if="isAuthorized('Study.Read')">
      <StudiesList />
    </div>
    
    <!-- Show only if user has any of these roles -->
    <div v-if="isAuthorized(['Library.Write', 'Library.Read'])">
      <LibrarySection />
    </div>
    
    <!-- Show only if user has ALL roles -->
    <div v-if="hasAllRoles(['Study.Read', 'Library.Write'])">
      <AdvancedFeatures />
    </div>
  </div>
</template>

<script>
import { useAuth } from '@/composables/useAuth'

export default {
  setup() {
    const { isAuthorized, hasAllRoles, roles } = useAuth()
    
    return {
      isAuthorized,
      hasAllRoles,
      roles
    }
  }
}
</script>
```

### Get Current User Info

```javascript
import { getCurrentUser, getRoles, getCustomTokenPayload } from '@/composables/useAuth'

// Get user data
const user = getCurrentUser()
console.log(user.name)   // "User One"
console.log(user.email)  // "user1@abc.com"

// Get roles
const roles = getRoles()
console.log(roles)  // ['Study.Read', 'Library.Write', 'Library.Read']

// Get decoded custom token payload
const payload = getCustomTokenPayload()
console.log(payload.roles)  // ['Study.Read', 'Library.Write', 'Library.Read']
console.log(payload.exp)    // 1762950471
```

### Making API Calls

**Important:** Always use the **original PocketBase token** for API calls:

```javascript
import { getOriginalToken } from '@/composables/useAuth'

async function fetchStudies() {
  const token = getOriginalToken()
  
  const response = await fetch('http://127.0.0.1:8090/api/collections/studies/records', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  return response.json()
}
```

### Route Guards

```javascript
// router/index.js
import { isAuthorized, checkAuth } from '@/composables/useAuth'

router.beforeEach((to, from, next) => {
  // Check authentication
  if (to.meta.requiresAuth && !checkAuth()) {
    return next({ name: 'Login' })
  }
  
  // Check role authorization
  const requiredRole = to.meta.requiredRole
  if (requiredRole && !isAuthorized(requiredRole)) {
    return next({ name: 'Unauthorized' })
  }
  
  next()
})

// Example route with role requirement
{
  path: '/library/edit',
  name: 'LibraryEditor',
  component: LibraryEditor,
  meta: {
    requiresAuth: true,
    requiredRole: 'Library.Write'
  }
}
```

## API Reference

### Authentication Methods

- **`login(email, password)`** - Login regular user
- **`adminLogin(email, password)`** - Login admin/superuser
- **`logout()`** - Clear all auth data
- **`restoreAuth()`** - Restore auth from localStorage
- **`checkAuth()`** - Check if user is authenticated

### Role Methods

- **`getRoles()`** - Get array of user roles
- **`isAuthorized(roles)`** - Check if user has ANY of the roles
- **`hasAllRoles(roles)`** - Check if user has ALL roles

### Token Methods

- **`getOriginalToken()`** - Get PocketBase token (for API calls)
- **`getCustomToken()`** - Get custom token (with roles)
- **`getCustomTokenPayload()`** - Get decoded custom token payload

### User Methods

- **`getCurrentUser()`** - Get current user object

### Composable Hook

```javascript
const {
  // Reactive state
  currentUser,
  isAuthenticated,
  roles,
  
  // Methods
  login,
  adminLogin,
  logout,
  getRoles,
  isAuthorized,
  hasAllRoles,
  getOriginalToken,
  getCustomToken,
  getCustomTokenPayload,
  getCurrentUser,
  restoreAuth,
  checkAuth
} = useAuth()
```

## Security Notes

### ⚠️ Important Security Considerations

1. **Custom JWT is for CLIENT-SIDE use only**
   - Never send the custom JWT to your backend
   - It's signed with a client-side secret (not cryptographically secure)
   - It's only for UI/UX authorization checks

2. **Always use Original PocketBase JWT for API calls**
   - The original token is validated by PocketBase backend
   - It's the only token that should be used in API requests

3. **Backend must verify permissions**
   - Never trust client-side role checks for security
   - Always verify permissions on the server/PocketBase side
   - Use PocketBase collection rules to enforce access control

4. **Roles can be modified in localStorage**
   - Users can technically modify localStorage
   - This only affects UI visibility
   - Backend should still validate all operations

### Example PocketBase Collection Rules

```javascript
// Library collection - List rule
@request.auth.id != "" && @request.auth.roles:each ?= "Library.Read"

// Library collection - Create/Update rule
@request.auth.id != "" && @request.auth.roles:each ?= "Library.Write"

// Study collection - View rule
@request.auth.id != "" && @request.auth.roles:each ?= "Study.Read"
```

## Testing

### After Login

Open browser console and check:

```javascript
// Check localStorage
console.log('Original Token:', localStorage.getItem('pb_original_token'))
console.log('Custom Token:', localStorage.getItem('pb_custom_token'))
console.log('User Data:', localStorage.getItem('pb_user_data'))

// Import and test functions
import { getRoles, getCustomTokenPayload, isAuthorized } from '@/composables/useAuth'

// Get roles
console.log('Roles:', getRoles())

// Check authorization
console.log('Can read studies?', isAuthorized('Study.Read'))
console.log('Can write library?', isAuthorized('Library.Write'))

// Get custom token payload
console.log('Custom Token Payload:', getCustomTokenPayload())
```

## Troubleshooting

### Token not persisting after refresh

- Check that `restoreAuth()` is called in `main.js`
- Check browser localStorage for the token keys
- Check console for any errors during auth restoration

### Roles not showing up

- Verify the user record in PocketBase has a `roles` field
- Check that it's an array of strings
- Check the custom token payload in console logs

### API calls failing

- Make sure you're using `getOriginalToken()` not `getCustomToken()`
- Verify PocketBase collection rules allow the operation
- Check that the token hasn't expired

## Next Steps

1. Update other components to use `useAuth` composable
2. Add route guards with role checking
3. Create role-specific UI components
4. Update API service files to use `getOriginalToken()`

## Example Components

See `USAGE_EXAMPLES.md` for complete component examples and patterns.


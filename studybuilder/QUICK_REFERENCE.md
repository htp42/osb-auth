# Quick Reference - Custom JWT with Roles

## Installation

✅ **No external dependencies required!**

This implementation uses browser-native APIs. Just import and use!

## Import

```javascript
import { useAuth } from '@/composables/useAuth'
// or
import { login, getRoles, isAuthorized } from '@/composables/useAuth'
```

---

## Authentication

### Login

```javascript
// Regular user login
const result = await login('user@example.com', 'password')

if (result.success) {
  console.log('Original Token:', result.originalToken)
  console.log('Custom Token:', result.customToken)
  console.log('User Data:', result.data.record)
}
```

### Admin Login

```javascript
// Admin/superuser login
const result = await adminLogin('admin@example.com', 'password')
```

### Logout

```javascript
import { logout } from '@/composables/useAuth'
logout()
```

### Check Authentication

```javascript
import { checkAuth } from '@/composables/useAuth'

if (checkAuth()) {
  // User is authenticated
}
```

---

## Roles

### Get User Roles

```javascript
import { getRoles } from '@/composables/useAuth'

const roles = getRoles()
// Returns: ['Study.Read', 'Library.Write', 'Library.Read']
```

### Check Single Role

```javascript
import { isAuthorized } from '@/composables/useAuth'

if (isAuthorized('Library.Write')) {
  // User has Library.Write role
}
```

### Check Multiple Roles (ANY)

```javascript
if (isAuthorized(['Library.Read', 'Library.Write'])) {
  // User has AT LEAST ONE of these roles
}
```

### Check All Roles (ALL)

```javascript
import { hasAllRoles } from '@/composables/useAuth'

if (hasAllRoles(['Study.Read', 'Library.Write'])) {
  // User has ALL of these roles
}
```

---

## Tokens

### Get Original PocketBase Token (for API calls)

```javascript
import { getOriginalToken } from '@/composables/useAuth'

const token = getOriginalToken()
// Use this for API calls to PocketBase
```

### Get Custom Token (with roles)

```javascript
import { getCustomToken } from '@/composables/useAuth'

const customToken = getCustomToken()
// This token includes roles in the payload
```

### Get Custom Token Payload

```javascript
import { getCustomTokenPayload } from '@/composables/useAuth'

const payload = getCustomTokenPayload()
console.log(payload.roles)  // ['Study.Read', 'Library.Write', ...]
console.log(payload.name)   // 'User One'
console.log(payload.email)  // 'user1@abc.com'
console.log(payload.exp)    // 1762950471
```

---

## User Info

### Get Current User

```javascript
import { getCurrentUser } from '@/composables/useAuth'

const user = getCurrentUser()
console.log(user.name)   // 'User One'
console.log(user.email)  // 'user1@abc.com'
console.log(user.roles)  // ['Study.Read', ...]
```

---

## Vue Composable Usage

### Setup with Composable

```javascript
import { useAuth } from '@/composables/useAuth'

export default {
  setup() {
    const { 
      currentUser,      // Reactive ref to user
      isAuthenticated,  // Reactive ref to auth status
      roles,            // Reactive ref to roles array
      login,
      logout,
      isAuthorized
    } = useAuth()
    
    return {
      currentUser,
      isAuthenticated,
      roles,
      login,
      logout,
      isAuthorized
    }
  }
}
```

### Use in Template

```vue
<template>
  <div>
    <p>Welcome, {{ currentUser?.name }}</p>
    <p>Roles: {{ roles.join(', ') }}</p>
    
    <button v-if="isAuthorized('Library.Write')" @click="edit">
      Edit
    </button>
  </div>
</template>
```

---

## API Calls

### Basic API Call

```javascript
import { getOriginalToken } from '@/composables/useAuth'

async function fetchData() {
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

### API Service Pattern

```javascript
import { getOriginalToken } from '@/composables/useAuth'

const API_BASE = 'http://127.0.0.1:8090/api'

async function apiCall(endpoint, options = {}) {
  const token = getOriginalToken()
  
  return fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  }).then(r => r.json())
}

// Usage
const studies = await apiCall('/collections/studies/records')
```

---

## Router Guards

### Basic Route Protection

```javascript
import { checkAuth, isAuthorized } from '@/composables/useAuth'

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !checkAuth()) {
    return next({ name: 'Login' })
  }
  
  if (to.meta.requiredRole && !isAuthorized(to.meta.requiredRole)) {
    return next({ name: 'Unauthorized' })
  }
  
  next()
})
```

### Route with Required Role

```javascript
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

---

## Conditional Rendering

### Simple Check

```vue
<button v-if="isAuthorized('Study.Read')">
  View Studies
</button>
```

### Multiple Roles

```vue
<div v-if="isAuthorized(['Library.Read', 'Library.Write'])">
  Library Section
</div>
```

### Computed Property

```vue
<template>
  <button v-if="canEdit" @click="edit">Edit</button>
</template>

<script>
import { computed } from 'vue'
import { useAuth } from '@/composables/useAuth'

export default {
  setup() {
    const { isAuthorized } = useAuth()
    
    const canEdit = computed(() => {
      return isAuthorized('Library.Write')
    })
    
    return { canEdit }
  }
}
</script>
```

### Disable Button

```vue
<button
  :disabled="!isAuthorized('Library.Write')"
  @click="save"
>
  Save
</button>
```

---

## Common Patterns

### Login Component

```javascript
async handleLogin() {
  const result = await login(this.email, this.password)
  
  if (result.success) {
    this.$router.push({ name: 'Dashboard' })
  } else {
    this.error = 'Login failed'
  }
}
```

### Protected Component

```javascript
import { isAuthorized } from '@/composables/useAuth'

export default {
  setup() {
    const authorized = isAuthorized('Library.Write')
    
    if (!authorized) {
      // Handle unauthorized access
      router.push({ name: 'Unauthorized' })
    }
    
    return { authorized }
  }
}
```

### Role-Based Dashboard

```javascript
const { roles, isAuthorized } = useAuth()

const sections = computed(() => {
  const available = []
  
  if (isAuthorized('Study.Read')) {
    available.push({ name: 'Studies', route: 'Studies' })
  }
  
  if (isAuthorized('Library.Read')) {
    available.push({ name: 'Library', route: 'Library' })
  }
  
  return available
})
```

---

## Debugging

### Log Current State

```javascript
import { getCustomTokenPayload, getRoles, getCurrentUser } from '@/composables/useAuth'

console.log('User:', getCurrentUser())
console.log('Roles:', getRoles())
console.log('Token Payload:', getCustomTokenPayload())
```

### Check localStorage

```javascript
console.log('Original Token:', localStorage.getItem('pb_original_token'))
console.log('Custom Token:', localStorage.getItem('pb_custom_token'))
console.log('User Data:', localStorage.getItem('pb_user_data'))
```

---

## Important Notes

### ⚠️ Security

1. **Always use original token for API calls** - Never use custom token
2. **Backend must verify permissions** - Don't rely on client-side checks
3. **Custom JWT is for UI only** - Not cryptographically secure

### Token Structure

**After successful login, you'll have:**

- `pb_original_token` - PocketBase JWT (for API calls)
- `pb_custom_token` - Custom JWT with roles (for UI)
- `pb_user_data` - User record
- `pb_user_type` - 'user' or 'admin'

### Custom JWT Payload

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

---

## Full API Reference

| Function | Description | Returns |
|----------|-------------|---------|
| `login(email, password)` | Login regular user | `Promise<{success, data, customToken, originalToken, userType}>` |
| `adminLogin(email, password)` | Login admin user | `Promise<{success, data, customToken, originalToken, userType}>` |
| `logout()` | Clear all auth data | `void` |
| `checkAuth()` | Check if authenticated | `boolean` |
| `getRoles()` | Get user roles array | `string[]` |
| `isAuthorized(roles)` | Check if has ANY role | `boolean` |
| `hasAllRoles(roles)` | Check if has ALL roles | `boolean` |
| `getOriginalToken()` | Get PocketBase token | `string \| null` |
| `getCustomToken()` | Get custom token | `string \| null` |
| `getCustomTokenPayload()` | Get decoded custom token | `object \| null` |
| `getCurrentUser()` | Get current user | `object \| null` |
| `restoreAuth()` | Restore from localStorage | `void` |
| `useAuth()` | Vue composable hook | `object` |

---

## Need Help?

- See `SETUP_INSTRUCTIONS.md` for complete setup guide
- See `USAGE_EXAMPLES.md` for full component examples
- Check browser console for auth debug logs
- Inspect localStorage for stored tokens


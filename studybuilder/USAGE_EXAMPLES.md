# Usage Examples - Custom JWT with Roles

Complete examples showing how to use the custom JWT authentication system in your Vue application.

## Table of Contents

1. [User Profile Component](#1-user-profile-component)
2. [Role-Based Dashboard](#2-role-based-dashboard)
3. [Protected Route Component](#3-protected-route-component)
4. [API Service with Token](#4-api-service-with-token)
5. [Route Guards](#5-route-guards)
6. [Conditional Rendering](#6-conditional-rendering)
7. [Admin Panel](#7-admin-panel)
8. [Debug Component](#8-debug-component)

---

## 1. User Profile Component

Shows user information and roles from the custom JWT.

```vue
<template>
  <v-card max-width="400" class="mx-auto">
    <v-card-title>User Profile</v-card-title>
    
    <v-card-text>
      <div class="mb-4">
        <v-avatar size="64" color="primary">
          <span class="text-h5">{{ userInitials }}</span>
        </v-avatar>
      </div>
      
      <div class="mb-2">
        <strong>Name:</strong> {{ currentUser?.name || 'N/A' }}
      </div>
      
      <div class="mb-2">
        <strong>Email:</strong> {{ currentUser?.email || 'N/A' }}
      </div>
      
      <div class="mb-2">
        <strong>User ID:</strong> {{ currentUser?.id || 'N/A' }}
      </div>
      
      <v-divider class="my-3" />
      
      <div class="mb-2">
        <strong>Permissions:</strong>
      </div>
      
      <v-chip
        v-for="role in roles"
        :key="role"
        size="small"
        color="primary"
        class="mr-1 mb-1"
      >
        {{ role }}
      </v-chip>
      
      <div v-if="roles.length === 0" class="text-caption text-grey">
        No roles assigned
      </div>
      
      <v-divider class="my-3" />
      
      <div class="text-caption">
        <div>Session expires: {{ tokenExpiry }}</div>
      </div>
    </v-card-text>
    
    <v-card-actions>
      <v-btn color="primary" variant="outlined" block @click="handleLogout">
        Logout
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { useAuth } from '@/composables/useAuth'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'UserProfile',
  setup() {
    const router = useRouter()
    const { currentUser, roles, logout, getCustomTokenPayload } = useAuth()
    
    const userInitials = computed(() => {
      const name = currentUser.value?.name || ''
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    })
    
    const tokenExpiry = computed(() => {
      const payload = getCustomTokenPayload()
      if (payload?.exp) {
        return new Date(payload.exp * 1000).toLocaleString()
      }
      return 'Unknown'
    })
    
    const handleLogout = () => {
      logout()
      router.push({ name: 'Login' })
    }
    
    return {
      currentUser,
      roles,
      userInitials,
      tokenExpiry,
      handleLogout
    }
  }
}
</script>
```

---

## 2. Role-Based Dashboard

Shows different sections based on user roles.

```vue
<template>
  <div class="dashboard">
    <v-container>
      <h1 class="mb-4">Dashboard</h1>
      
      <!-- Welcome Message -->
      <v-alert type="info" class="mb-4">
        Welcome back, {{ currentUser?.name }}!
        You have {{ roles.length }} permission{{ roles.length !== 1 ? 's' : '' }}.
      </v-alert>
      
      <!-- Studies Section -->
      <v-card v-if="canReadStudies" class="mb-4">
        <v-card-title>
          <v-icon start>mdi-book-multiple</v-icon>
          Studies
        </v-card-title>
        <v-card-text>
          <p>View and manage clinical studies.</p>
          <v-btn
            color="primary"
            :to="{ name: 'Studies' }"
          >
            View Studies
          </v-btn>
        </v-card-text>
      </v-card>
      
      <!-- Library Section -->
      <v-card v-if="canAccessLibrary" class="mb-4">
        <v-card-title>
          <v-icon start>mdi-library</v-icon>
          Library
        </v-card-title>
        <v-card-text>
          <p>Access the library of reusable components.</p>
          <div class="d-flex gap-2">
            <v-btn
              v-if="canReadLibrary"
              color="primary"
              variant="outlined"
              :to="{ name: 'Library' }"
            >
              View Library
            </v-btn>
            <v-btn
              v-if="canWriteLibrary"
              color="primary"
              :to="{ name: 'LibraryEditor' }"
            >
              Edit Library
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
      
      <!-- No Access Message -->
      <v-alert v-if="!hasAnyAccess" type="warning">
        You don't have access to any sections yet.
        Please contact your administrator.
      </v-alert>
      
      <!-- Role Summary -->
      <v-card>
        <v-card-title>Your Permissions</v-card-title>
        <v-card-text>
          <v-chip
            v-for="role in roles"
            :key="role"
            class="mr-1 mb-1"
            color="primary"
          >
            {{ role }}
          </v-chip>
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>

<script>
import { useAuth } from '@/composables/useAuth'
import { computed } from 'vue'

export default {
  name: 'Dashboard',
  setup() {
    const { currentUser, roles, isAuthorized } = useAuth()
    
    const canReadStudies = computed(() => isAuthorized('Study.Read'))
    const canReadLibrary = computed(() => isAuthorized('Library.Read'))
    const canWriteLibrary = computed(() => isAuthorized('Library.Write'))
    
    const canAccessLibrary = computed(() => 
      canReadLibrary.value || canWriteLibrary.value
    )
    
    const hasAnyAccess = computed(() => 
      canReadStudies.value || canAccessLibrary.value
    )
    
    return {
      currentUser,
      roles,
      canReadStudies,
      canReadLibrary,
      canWriteLibrary,
      canAccessLibrary,
      hasAnyAccess
    }
  }
}
</script>
```

---

## 3. Protected Route Component

Component that requires specific roles to access.

```vue
<template>
  <div class="library-editor">
    <v-container>
      <v-alert v-if="!authorized" type="error" class="mb-4">
        You don't have permission to edit the library.
        Required role: Library.Write
      </v-alert>
      
      <template v-else>
        <h1 class="mb-4">Library Editor</h1>
        
        <v-card>
          <v-card-title>Edit Library Items</v-card-title>
          <v-card-text>
            <!-- Your editor content here -->
            <p>Editor interface for users with Library.Write permission.</p>
          </v-card-text>
        </v-card>
      </template>
    </v-container>
  </div>
</template>

<script>
import { useAuth } from '@/composables/useAuth'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'LibraryEditor',
  setup() {
    const router = useRouter()
    const { isAuthorized } = useAuth()
    const authorized = ref(false)
    
    onMounted(() => {
      authorized.value = isAuthorized('Library.Write')
      
      // Optionally redirect if not authorized
      if (!authorized.value) {
        console.warn('User not authorized for Library Editor')
        // Uncomment to redirect:
        // router.push({ name: 'Unauthorized' })
      }
    })
    
    return {
      authorized
    }
  }
}
</script>
```

---

## 4. API Service with Token

Service for making API calls using the original PocketBase token.

```javascript
// services/studyService.js
import { getOriginalToken } from '@/composables/useAuth'

const API_BASE = 'http://127.0.0.1:8090/api'

/**
 * Make authenticated API call
 */
async function apiCall(endpoint, options = {}) {
  const token = getOriginalToken()
  
  if (!token) {
    throw new Error('Not authenticated')
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  })
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * Study Service
 */
export const studyService = {
  // Get all studies
  async getStudies() {
    return apiCall('/collections/studies/records')
  },
  
  // Get single study
  async getStudy(id) {
    return apiCall(`/collections/studies/records/${id}`)
  },
  
  // Create study
  async createStudy(data) {
    return apiCall('/collections/studies/records', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  
  // Update study
  async updateStudy(id, data) {
    return apiCall(`/collections/studies/records/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  },
  
  // Delete study
  async deleteStudy(id) {
    return apiCall(`/collections/studies/records/${id}`, {
      method: 'DELETE'
    })
  }
}

/**
 * Library Service
 */
export const libraryService = {
  // Get library items
  async getItems() {
    return apiCall('/collections/library/records')
  },
  
  // Create library item
  async createItem(data) {
    return apiCall('/collections/library/records', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  
  // Update library item
  async updateItem(id, data) {
    return apiCall(`/collections/library/records/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }
}
```

### Usage in Component

```vue
<script>
import { studyService } from '@/services/studyService'
import { useAuth } from '@/composables/useAuth'

export default {
  setup() {
    const { isAuthorized } = useAuth()
    const studies = ref([])
    const loading = ref(false)
    const error = ref(null)
    
    const loadStudies = async () => {
      // Check authorization first
      if (!isAuthorized('Study.Read')) {
        error.value = 'You do not have permission to view studies'
        return
      }
      
      loading.value = true
      try {
        const result = await studyService.getStudies()
        studies.value = result.items
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }
    
    onMounted(() => {
      loadStudies()
    })
    
    return {
      studies,
      loading,
      error,
      loadStudies
    }
  }
}
</script>
```

---

## 5. Route Guards

Complete router setup with authentication and role-based guards.

```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { checkAuth, isAuthorized } from '@/composables/useAuth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomePage.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginPage.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/studies',
    name: 'Studies',
    component: () => import('@/views/StudiesView.vue'),
    meta: { 
      requiresAuth: true,
      requiredRole: 'Study.Read'
    }
  },
  {
    path: '/library',
    name: 'Library',
    component: () => import('@/views/LibraryView.vue'),
    meta: { 
      requiresAuth: true,
      requiredRole: 'Library.Read'
    }
  },
  {
    path: '/library/edit',
    name: 'LibraryEditor',
    component: () => import('@/views/LibraryEditor.vue'),
    meta: { 
      requiresAuth: true,
      requiredRole: 'Library.Write'
    }
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: () => import('@/views/UnauthorizedPage.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundPage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Global navigation guard
router.beforeEach((to, from, next) => {
  const requiresAuth = to.meta.requiresAuth
  const requiredRole = to.meta.requiredRole
  const authenticated = checkAuth()
  
  // Check authentication
  if (requiresAuth && !authenticated) {
    console.log('Not authenticated, redirecting to login')
    return next({
      name: 'Login',
      query: { redirect: to.fullPath }
    })
  }
  
  // Check role authorization
  if (requiredRole && !isAuthorized(requiredRole)) {
    console.log(`Missing required role: ${requiredRole}`)
    return next({ name: 'Unauthorized' })
  }
  
  // Redirect to dashboard if authenticated user tries to access login
  if (to.name === 'Login' && authenticated) {
    return next({ name: 'Dashboard' })
  }
  
  next()
})

export default router
```

---

## 6. Conditional Rendering

Various patterns for showing/hiding content based on roles.

```vue
<template>
  <div>
    <!-- Simple role check -->
    <v-btn v-if="isAuthorized('Study.Read')" @click="viewStudies">
      View Studies
    </v-btn>
    
    <!-- Multiple roles (ANY) -->
    <v-btn v-if="isAuthorized(['Library.Read', 'Library.Write'])" @click="openLibrary">
      Open Library
    </v-btn>
    
    <!-- All roles required -->
    <v-btn v-if="hasAllRoles(['Study.Read', 'Library.Write'])" @click="advancedFeature">
      Advanced Feature
    </v-btn>
    
    <!-- Computed property for complex logic -->
    <v-btn v-if="canManageContent" @click="manage">
      Manage Content
    </v-btn>
    
    <!-- Show different content based on roles -->
    <div v-if="isAuthorized('Library.Write')">
      <h3>Editor Mode</h3>
      <button @click="edit">Edit</button>
      <button @click="delete">Delete</button>
    </div>
    <div v-else-if="isAuthorized('Library.Read')">
      <h3>Read-Only Mode</h3>
      <button @click="view">View</button>
    </div>
    <div v-else>
      <p>No access to library</p>
    </div>
    
    <!-- Disable button if no permission -->
    <v-btn
      :disabled="!isAuthorized('Library.Write')"
      @click="save"
    >
      Save Changes
    </v-btn>
    
    <!-- Show role badges -->
    <div class="roles-display">
      <v-chip
        v-for="role in roles"
        :key="role"
        size="small"
        :color="getRoleColor(role)"
        class="mr-1"
      >
        {{ role }}
      </v-chip>
    </div>
  </div>
</template>

<script>
import { useAuth } from '@/composables/useAuth'
import { computed } from 'vue'

export default {
  setup() {
    const { roles, isAuthorized, hasAllRoles } = useAuth()
    
    // Complex computed permission
    const canManageContent = computed(() => {
      return isAuthorized('Library.Write') && isAuthorized('Study.Read')
    })
    
    const getRoleColor = (role) => {
      if (role.includes('Write')) return 'success'
      if (role.includes('Read')) return 'info'
      if (role.includes('Admin')) return 'error'
      return 'default'
    }
    
    return {
      roles,
      isAuthorized,
      hasAllRoles,
      canManageContent,
      getRoleColor
    }
  }
}
</script>
```

---

## 7. Admin Panel

Admin-only component with elevated permissions.

```vue
<template>
  <v-container>
    <v-alert v-if="!isAdmin" type="error" prominent>
      <v-icon large>mdi-shield-alert</v-icon>
      <div class="text-h6">Access Denied</div>
      <div>This section requires administrator privileges.</div>
    </v-alert>
    
    <template v-else>
      <v-card class="mb-4">
        <v-card-title>
          <v-icon start>mdi-shield-crown</v-icon>
          Admin Panel
        </v-card-title>
        <v-card-text>
          <p>Welcome, Administrator {{ currentUser?.name }}</p>
          
          <v-divider class="my-3" />
          
          <h3>Admin Actions</h3>
          <div class="d-flex flex-wrap gap-2 mt-2">
            <v-btn color="primary" @click="manageUsers">
              Manage Users
            </v-btn>
            <v-btn color="primary" @click="viewLogs">
              View Logs
            </v-btn>
            <v-btn color="warning" @click="systemSettings">
              System Settings
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
      
      <!-- System Stats -->
      <v-row>
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>Users</v-card-title>
            <v-card-text class="text-h4">{{ stats.users }}</v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>Studies</v-card-title>
            <v-card-text class="text-h4">{{ stats.studies }}</v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>Library Items</v-card-title>
            <v-card-text class="text-h4">{{ stats.libraryItems }}</v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script>
import { useAuth } from '@/composables/useAuth'
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'AdminPanel',
  setup() {
    const router = useRouter()
    const { currentUser, getRoles } = useAuth()
    const stats = ref({
      users: 0,
      studies: 0,
      libraryItems: 0
    })
    
    const isAdmin = computed(() => {
      const roles = getRoles()
      return roles.includes('admin') || roles.includes('superuser')
    })
    
    onMounted(async () => {
      if (!isAdmin.value) {
        router.push({ name: 'Unauthorized' })
        return
      }
      
      // Load admin stats
      await loadStats()
    })
    
    const loadStats = async () => {
      // Fetch admin statistics
      // stats.value = await adminService.getStats()
    }
    
    return {
      currentUser,
      isAdmin,
      stats
    }
  }
}
</script>
```

---

## 8. Debug Component

Development tool to inspect auth state.

```vue
<template>
  <v-expansion-panels v-if="isDevelopment" class="debug-panel">
    <v-expansion-panel>
      <v-expansion-panel-title>
        🔍 Auth Debug Info
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <v-tabs v-model="tab">
          <v-tab value="user">User</v-tab>
          <v-tab value="tokens">Tokens</v-tab>
          <v-tab value="storage">Storage</v-tab>
        </v-tabs>
        
        <v-window v-model="tab" class="mt-3">
          <!-- User Tab -->
          <v-window-item value="user">
            <h4>Current User</h4>
            <pre>{{ JSON.stringify(currentUser, null, 2) }}</pre>
            
            <h4 class="mt-3">Roles</h4>
            <v-chip
              v-for="role in roles"
              :key="role"
              size="small"
              class="mr-1 mb-1"
            >
              {{ role }}
            </v-chip>
            <div v-if="roles.length === 0" class="text-caption">No roles</div>
          </v-window-item>
          
          <!-- Tokens Tab -->
          <v-window-item value="tokens">
            <h4>Original PocketBase Token</h4>
            <pre class="token-display">{{ originalToken }}</pre>
            
            <h4 class="mt-3">Custom JWT Token</h4>
            <pre class="token-display">{{ customToken }}</pre>
            
            <h4 class="mt-3">Custom JWT Decoded</h4>
            <pre>{{ JSON.stringify(customTokenPayload, null, 2) }}</pre>
          </v-window-item>
          
          <!-- Storage Tab -->
          <v-window-item value="storage">
            <h4>localStorage Keys</h4>
            <pre>{{ JSON.stringify(storageData, null, 2) }}</pre>
          </v-window-item>
        </v-window>
        
        <v-divider class="my-3" />
        
        <v-btn size="small" color="error" @click="clearAuth">
          Clear Auth
        </v-btn>
        <v-btn size="small" @click="refresh" class="ml-2">
          Refresh
        </v-btn>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script>
import { useAuth } from '@/composables/useAuth'
import { ref, computed, onMounted } from 'vue'

export default {
  name: 'AuthDebugPanel',
  setup() {
    const {
      currentUser,
      roles,
      getOriginalToken,
      getCustomToken,
      getCustomTokenPayload,
      logout
    } = useAuth()
    
    const tab = ref('user')
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    const originalToken = computed(() => getOriginalToken())
    const customToken = computed(() => getCustomToken())
    const customTokenPayload = computed(() => getCustomTokenPayload())
    
    const storageData = computed(() => {
      return {
        pb_original_token: localStorage.getItem('pb_original_token') ? '(exists)' : null,
        pb_custom_token: localStorage.getItem('pb_custom_token') ? '(exists)' : null,
        pb_user_data: localStorage.getItem('pb_user_data'),
        pb_user_type: localStorage.getItem('pb_user_type')
      }
    })
    
    const clearAuth = () => {
      if (confirm('Clear all auth data?')) {
        logout()
        window.location.reload()
      }
    }
    
    const refresh = () => {
      window.location.reload()
    }
    
    return {
      currentUser,
      roles,
      originalToken,
      customToken,
      customTokenPayload,
      storageData,
      isDevelopment,
      tab,
      clearAuth,
      refresh
    }
  }
}
</script>

<style scoped>
.debug-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  max-height: 500px;
  overflow: auto;
}

pre {
  font-size: 11px;
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 300px;
}

.token-display {
  word-break: break-all;
  white-space: pre-wrap;
}
</style>
```

---

## Quick Start

1. **No installation needed!** Uses browser-native APIs ✅

2. **Login:**
```javascript
import { login } from '@/composables/useAuth'
const result = await login('user@example.com', 'password')
```

3. **Check roles:**
```javascript
import { getRoles, isAuthorized } from '@/composables/useAuth'
const roles = getRoles()  // ['Study.Read', 'Library.Write']
const canEdit = isAuthorized('Library.Write')  // true/false
```

4. **Make API call:**
```javascript
import { getOriginalToken } from '@/composables/useAuth'
const token = getOriginalToken()
fetch(url, { headers: { Authorization: `Bearer ${token}` } })
```

See `SETUP_INSTRUCTIONS.md` for complete documentation.


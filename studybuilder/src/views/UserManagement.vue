<template>
  <v-container fluid class="pa-6">
    <v-card class="mx-auto" max-width="1400">
      <v-card-title class="d-flex align-center pa-6">
        <v-icon class="mr-3" size="large">mdi-account-group</v-icon>
        <span class="text-h4">User Management</span>
        <v-spacer />
        <v-btn
          color="primary"
          prepend-icon="mdi-account-plus"
          @click="openCreateDialog"
        >
          Create New User
        </v-btn>
      </v-card-title>

      <v-divider />

      <!-- Users Table -->
      <v-card-text>
        <!-- Summary Stats -->
        <v-row v-if="!loading && users.length > 0" class="mb-4">
          <v-col cols="12" md="3">
            <v-card color="primary" variant="tonal">
              <v-card-text class="text-center">
                <div class="text-h4">{{ users.length }}</div>
                <div class="text-caption">Total Users</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card color="secondary" variant="tonal">
              <v-card-text class="text-center">
                <div class="text-h4">{{ users.filter(u => u.userType === 'admin').length }}</div>
                <div class="text-caption">Super Users</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card color="info" variant="tonal">
              <v-card-text class="text-center">
                <div class="text-h4">{{ users.filter(u => u.userType === 'user').length }}</div>
                <div class="text-caption">Regular Users</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card color="success" variant="tonal">
              <v-card-text class="text-center">
                <div class="text-h4">{{ users.filter(u => u.verified).length }}</div>
                <div class="text-caption">Verified Users</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        
        <!-- Debug Info -->
        <v-alert v-if="!loading && users.length === 0" type="info" class="mb-4">
          <div class="text-subtitle-2">Debug Information:</div>
          <div>Authenticated: {{ pb.authStore.isValid ? 'Yes' : 'No' }}</div>
          <div>Current User: {{ currentUser?.email || 'None' }}</div>
          <div>User Role: {{ currentUser?.role }}</div>
          <div>Is Admin: {{ isAdmin ? 'Yes' : 'No' }}</div>
          <div>Total Users Loaded: {{ users.length }}</div>
          <v-btn size="small" color="primary" @click="testConnection" class="mt-2">
            Test PocketBase Connection
          </v-btn>
        </v-alert>
        
        <v-data-table
          :headers="headers"
          :items="users"
          :loading="loading"
          :items-per-page="10"
          class="elevation-1"
        >
          <!-- Email Column -->
          <template #item.email="{ item }">
            <div class="d-flex align-center">
              <v-icon
                v-if="item.verified"
                color="success"
                size="small"
                class="mr-2"
              >
                mdi-check-circle
              </v-icon>
              <v-icon v-else color="warning" size="small" class="mr-2">
                mdi-alert-circle
              </v-icon>
              {{ item.email }}
            </div>
          </template>

          <!-- User Type Column -->
          <template #item.userType="{ item }">
            <v-chip
              :color="item.userType === 'admin' ? 'secondary' : 'info'"
              size="small"
              variant="tonal"
            >
              <v-icon start size="small">
                {{ item.userType === 'admin' ? 'mdi-shield-star' : 'mdi-account-circle' }}
              </v-icon>
              {{ item.userType === 'admin' ? 'Super User' : 'Regular User' }}
            </v-chip>
          </template>

          <!-- Role Column -->
          <template #item.role="{ item }">
            <v-chip
              :color="item.role === 1 ? 'error' : 'primary'"
              size="small"
              variant="flat"
            >
              <v-icon start size="small">
                {{ item.role === 1 ? 'mdi-shield-crown' : 'mdi-account' }}
              </v-icon>
              {{ item.role === 1 ? 'Admin' : 'User' }}
            </v-chip>
          </template>

          <!-- Permissions/Roles Column -->
          <template #item.roles="{ item }">
            <div v-if="item.roles && item.roles.length > 0" class="d-flex flex-wrap ga-1">
              <v-chip
                v-for="(role, index) in item.roles"
                :key="index"
                size="x-small"
                :color="item.userType === 'admin' ? 'secondary' : 'info'"
                variant="outlined"
              >
                {{ role }}
              </v-chip>
            </div>
            <span v-else class="text-caption text-grey">No permissions</span>
          </template>

          <!-- Created Date Column -->
          <template #item.created="{ item }">
            {{ formatDate(item.created) }}
          </template>

          <!-- Actions Column -->
          <template #item.actions="{ item }">
            <v-btn
              :icon="item.verified ? 'mdi-check-decagram' : 'mdi-check-decagram-outline'"
              size="small"
              variant="text"
              :color="item.verified ? 'success' : 'grey'"
              @click="toggleVerified(item)"
            >
              <v-icon>{{ item.verified ? 'mdi-check-decagram' : 'mdi-check-decagram-outline' }}</v-icon>
              <v-tooltip activator="parent" location="top">
                {{ item.verified ? 'Mark as Unverified' : 'Mark as Verified' }}
              </v-tooltip>
            </v-btn>
            <v-btn
              icon="mdi-lock-reset"
              size="small"
              variant="text"
              color="warning"
              @click="openPasswordDialog(item)"
            >
              <v-icon>mdi-lock-reset</v-icon>
              <v-tooltip activator="parent" location="top">
                Reset Password
              </v-tooltip>
            </v-btn>
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              color="primary"
              @click="openEditDialog(item)"
            >
              <v-icon>mdi-pencil</v-icon>
              <v-tooltip activator="parent" location="top">
                Edit User
              </v-tooltip>
            </v-btn>
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="openDeleteDialog(item)"
            >
              <v-icon>mdi-delete</v-icon>
              <v-tooltip activator="parent" location="top">
                Delete User
              </v-tooltip>
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Create/Edit User Dialog -->
    <v-dialog v-model="userDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title class="bg-primary">
          <span class="text-h5 text-white">
            {{ editMode ? 'Edit User' : 'Create New User' }}
          </span>
        </v-card-title>

        <v-card-text class="pt-6">
          <!-- Info for create mode -->
          <v-alert v-if="!editMode" type="info" variant="tonal" density="compact" class="mb-4">
            <div class="text-caption">
              <strong>User:</strong> Regular user account (users collection) with category-based roles<br>
              <strong>Admin:</strong> Super user account (_superusers collection, role=1) with category-based roles
            </div>
          </v-alert>
          
          <v-form ref="userForm" v-model="userFormValid">
            <!-- User Type Selection (Create Mode Only) -->
            <v-select
              v-if="!editMode"
              v-model="userFormData.userType"
              label="User Type"
              :items="userTypeOptions"
              item-title="text"
              item-value="value"
              prepend-inner-icon="mdi-account-cog"
              variant="outlined"
              required
              class="mb-3"
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <template #prepend>
                    <v-icon :color="item.raw.value === 'admin' ? 'error' : 'primary'">
                      {{ item.raw.icon }}
                    </v-icon>
                  </template>
                  <template #subtitle>
                    <span class="text-caption">{{ item.raw.description }}</span>
                  </template>
                </v-list-item>
              </template>
            </v-select>

            <!-- Category Selection (Create Mode - for both User and Admin) -->
            <v-select
              v-if="!editMode"
              v-model="userFormData.category"
              :label="userFormData.userType === 'admin' ? 'Admin Category' : 'User Category'"
              :items="userFormData.userType === 'admin' ? adminCategoryOptions : userCategoryOptions"
              item-title="text"
              item-value="value"
              prepend-inner-icon="mdi-shield-account"
              variant="outlined"
              required
              class="mb-3"
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <template #subtitle>
                    <div class="text-caption mt-1">
                      <v-chip
                        v-for="role in item.raw.roles"
                        :key="role"
                        size="x-small"
                        class="mr-1 mt-1"
                        :color="userFormData.userType === 'admin' ? 'error' : 'info'"
                        variant="outlined"
                      >
                        {{ role }}
                      </v-chip>
                    </div>
                  </template>
                </v-list-item>
              </template>
            </v-select>

            <v-text-field
              v-model="userFormData.email"
              label="Email"
              :rules="emailRules"
              prepend-inner-icon="mdi-email"
              variant="outlined"
              required
              class="mb-3"
            />

            <v-text-field
              v-model="userFormData.name"
              label="Name"
              :rules="nameRules"
              prepend-inner-icon="mdi-account"
              variant="outlined"
              required
              class="mb-3"
            />

            <v-text-field
              v-if="!editMode"
              v-model="userFormData.password"
              label="Password"
              :rules="passwordRules"
              :type="showPassword ? 'text' : 'password'"
              prepend-inner-icon="mdi-lock"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
              variant="outlined"
              required
              class="mb-3"
            />

            <v-text-field
              v-if="!editMode"
              v-model="userFormData.passwordConfirm"
              label="Confirm Password"
              :rules="confirmPasswordRules"
              :type="showPassword ? 'text' : 'password'"
              prepend-inner-icon="mdi-lock-check"
              variant="outlined"
              required
              class="mb-3"
            />

            <!-- Only show Role, Category, and Verified when editing -->
            <v-select
              v-if="editMode"
              v-model="userFormData.role"
              label="Role"
              :items="roleOptions"
              item-title="text"
              item-value="value"
              prepend-inner-icon="mdi-shield-account"
              variant="outlined"
              required
              class="mb-3"
            />

            <!-- Category Selection for Edit Mode -->
            <v-select
              v-if="editMode"
              v-model="userFormData.category"
              :label="selectedUser?.userType === 'admin' ? 'Admin Category' : 'User Category'"
              :items="selectedUser?.userType === 'admin' ? adminCategoryOptions : userCategoryOptions"
              item-title="text"
              item-value="value"
              prepend-inner-icon="mdi-account-cog"
              variant="outlined"
              required
              class="mb-3"
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <template #subtitle>
                    <div class="text-caption mt-1">
                      <v-chip
                        v-for="role in item.raw.roles"
                        :key="role"
                        size="x-small"
                        class="mr-1 mt-1"
                        :color="selectedUser?.userType === 'admin' ? 'error' : 'info'"
                        variant="outlined"
                      >
                        {{ role }}
                      </v-chip>
                    </div>
                  </template>
                </v-list-item>
              </template>
            </v-select>

            <!-- Show current roles as chips in edit mode -->
            <v-card v-if="editMode && userFormData.roles && userFormData.roles.length > 0" variant="tonal" color="info" class="mb-3">
              <v-card-text>
                <div class="text-caption mb-2">Current Permissions:</div>
                <div class="d-flex flex-wrap ga-1">
                  <v-chip
                    v-for="(role, index) in userFormData.roles"
                    :key="index"
                    size="small"
                    :color="selectedUser?.userType === 'admin' ? 'secondary' : 'info'"
                    variant="outlined"
                  >
                    {{ role }}
                  </v-chip>
                </div>
              </v-card-text>
            </v-card>

            <v-switch
              v-if="editMode"
              v-model="userFormData.verified"
              label="Email Verified"
              color="success"
              class="mb-3"
            >
              <template #details>
                <div class="text-caption mt-1">
                  Current value: {{ userFormData.verified ? 'Verified' : 'Not Verified' }}
                </div>
              </template>
            </v-switch>

            <v-alert v-if="userFormError" type="error" variant="tonal" class="mt-3">
              {{ userFormError }}
            </v-alert>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            variant="text"
            @click="closeUserDialog"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="submitting"
            @click="saveUser"
          >
            {{ editMode ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Password Reset Dialog -->
    <v-dialog v-model="passwordDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="bg-warning">
          <span class="text-h5">Reset Password</span>
        </v-card-title>

        <v-card-text class="pt-6">
          <v-alert type="info" variant="tonal" class="mb-4">
            Resetting password for: <strong>{{ selectedUser?.email }}</strong>
          </v-alert>

          <v-form ref="passwordForm" v-model="passwordFormValid">
            <v-text-field
              v-model="newPassword"
              label="New Password"
              :rules="passwordRules"
              :type="showNewPassword ? 'text' : 'password'"
              prepend-inner-icon="mdi-lock"
              :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showNewPassword = !showNewPassword"
              variant="outlined"
              required
              class="mb-3"
            />

            <v-text-field
              v-model="confirmNewPassword"
              label="Confirm New Password"
              :rules="newPasswordConfirmRules"
              :type="showNewPassword ? 'text' : 'password'"
              prepend-inner-icon="mdi-lock-check"
              variant="outlined"
              required
            />

            <v-alert v-if="passwordError" type="error" variant="tonal" class="mt-3">
              {{ passwordError }}
            </v-alert>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            variant="text"
            @click="closePasswordDialog"
          >
            Cancel
          </v-btn>
          <v-btn
            color="warning"
            variant="flat"
            :loading="resetting"
            @click="resetPassword"
          >
            Reset Password
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="bg-error">
          <span class="text-h5 text-white">Delete User</span>
        </v-card-title>

        <v-card-text class="pt-6">
          <v-alert type="warning" variant="tonal" class="mb-4">
            <div class="text-subtitle-1 font-weight-bold mb-2">
              ⚠️ Warning: This action cannot be undone!
            </div>
            <div>
              Are you sure you want to delete this user?
            </div>
          </v-alert>

          <div class="text-body-1 mb-2">
            <strong>Email:</strong> {{ selectedUser?.email }}
          </div>
          <div class="text-body-1 mb-2">
            <strong>Name:</strong> {{ selectedUser?.name }}
          </div>
          <div class="text-body-1 mb-2">
            <strong>Type:</strong> {{ selectedUser?.userType === 'admin' ? 'Super User' : 'Regular User' }}
          </div>
          <div class="text-body-1">
            <strong>Role:</strong> {{ selectedUser?.role === 1 ? 'Admin' : 'User' }}
          </div>

          <v-alert v-if="deleteError" type="error" variant="tonal" class="mt-3">
            {{ deleteError }}
          </v-alert>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            variant="text"
            @click="closeDeleteDialog"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="deleting"
            @click="deleteUser"
          >
            Delete User
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success Snackbar -->
    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="3000"
      location="top"
    >
      {{ snackbarMessage }}
      <template #actions>
        <v-btn variant="text" @click="snackbar = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { pb, currentUser } from '@/utils/pocketbase'

const router = useRouter()

// Data
const users = ref([])
const loading = ref(false)
const userDialog = ref(false)
const passwordDialog = ref(false)
const deleteDialog = ref(false)
const editMode = ref(false)
const selectedUser = ref(null)
const submitting = ref(false)
const resetting = ref(false)
const deleting = ref(false)
const userFormValid = ref(false)
const passwordFormValid = ref(false)
const showPassword = ref(false)
const showNewPassword = ref(false)
const userFormError = ref('')
const passwordError = ref('')
const deleteError = ref('')
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// Form refs
const userForm = ref(null)
const passwordForm = ref(null)

// Form data
const userFormData = ref({
  email: '',
  name: '',
  password: '',
  passwordConfirm: '',
  role: 0,
  verified: true,
  userType: 'user', // 'user' or 'admin'
  category: 'studybuilder_readers', // category with roles for both user types
  roles: [], // array of permission strings
})

const newPassword = ref('')
const confirmNewPassword = ref('')

// Table headers
const headers = [
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Type', key: 'userType', sortable: true },
  { title: 'Role', key: 'role', sortable: true },
  { title: 'Permissions', key: 'roles', sortable: false },
  { title: 'Created', key: 'created', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' },
]

// Role options
const roleOptions = [
  { text: 'User', value: 0 },
  { text: 'Admin', value: 1 },
]

// User Type options
const userTypeOptions = [
  { 
    text: 'Regular User', 
    value: 'user',
    icon: 'mdi-account',
    description: 'Standard user account with basic permissions'
  },
  { 
    text: 'Admin/Super User', 
    value: 'admin',
    icon: 'mdi-shield-crown',
    description: 'Administrator with role-based permissions'
  },
]

// Regular User Category options with roles
const userCategoryOptions = [
  {
    text: 'StudyBuilder Readers',
    value: 'studybuilder_readers',
    roles: ['Study.Read', 'Library.Read']
  },
  {
    text: 'Library Contributors',
    value: 'library_contributors',
    roles: ['Study.Read', 'Library.Write', 'Library.Read']
  },
  {
    text: 'Study Contributors',
    value: 'study_contributors',
    roles: ['Study.Write', 'Study.Read', 'Library.Read']
  },
  {
    text: 'StudyBuilder Superusers',
    value: 'studybuilder_superusers',
    roles: ['Study.Write', 'Library.Write', 'Study.Read', 'Library.Read']
  },
]

// Admin Category options with roles (same as user categories)
const adminCategoryOptions = [
  {
    text: 'StudyBuilder Readers',
    value: 'studybuilder_readers',
    roles: ['Study.Read', 'Library.Read']
  },
  {
    text: 'Library Contributors',
    value: 'library_contributors',
    roles: ['Study.Read', 'Library.Write', 'Library.Read']
  },
  {
    text: 'Study Contributors',
    value: 'study_contributors',
    roles: ['Study.Write', 'Study.Read', 'Library.Read']
  },
  {
    text: 'StudyBuilder Superusers',
    value: 'studybuilder_superusers',
    roles: ['Study.Write', 'Library.Write', 'Study.Read', 'Library.Read']
  },
]

// Validation rules
const emailRules = [
  (v) => !!v || 'Email is required',
  (v) => /.+@.+\..+/.test(v) || 'Must be a valid email',
]

const nameRules = [
  (v) => !!v || 'Name is required',
  (v) => (v && v.length >= 2) || 'Name must be at least 2 characters',
]

const passwordRules = [
  (v) => !!v || 'Password is required',
  (v) => (v && v.length >= 8) || 'Password must be at least 8 characters',
]

const confirmPasswordRules = [
  (v) => !!v || 'Please confirm password',
  (v) => v === userFormData.value.password || 'Passwords do not match',
]

const newPasswordConfirmRules = [
  (v) => !!v || 'Please confirm password',
  (v) => v === newPassword.value || 'Passwords do not match',
]

// Computed
const isAdmin = computed(() => {
  return currentUser.value?.role === 1
})

// Methods
const checkAdminAccess = () => {
  if (!isAdmin.value) {
    showSnackbar('Access denied. Admin privileges required.', 'error')
    router.push({ name: 'Studies' })
  }
}

const fetchUsers = async () => {
  loading.value = true
  
  console.log('=== Starting fetchUsers ===')
  console.log('PocketBase baseUrl:', pb.baseUrl)
  console.log('Auth Store isValid:', pb.authStore.isValid)
  console.log('Auth Store token exists:', !!pb.authStore.token)
  console.log('Auth Store model:', pb.authStore.model)
  console.log('currentUser ref:', currentUser.value)
  
  // Check authentication first
  if (!pb.authStore.isValid) {
    console.warn('❌ Not authenticated!')
    showSnackbar('Not authenticated. Please login.', 'error')
    loading.value = false
    router.push({ name: 'Login' })
    return
  }
  
  try {
    console.log('📡 Fetching users from both collections...')
    
    // Fetch regular users from users collection
    const regularUsers = await pb.collection('users').getFullList({
      sort: '-created',
      $autoCancel: false,
      fields: 'id,email,name,role,verified,created,updated,roles',
    }).catch(err => {
      console.warn('⚠️ Error fetching regular users:', err)
      return []
    })
    
    console.log(`✅ Fetched ${regularUsers.length} regular users`)
    
    // Fetch super users from _superusers collection
    const superUsers = await pb.collection('_superusers').getFullList({
      sort: '-created',
      $autoCancel: false,
      fields: 'id,email,name,role,verified,created,updated,roles',
    }).catch(err => {
      console.warn('⚠️ Error fetching super users:', err)
      return []
    })
    
    console.log(`✅ Fetched ${superUsers.length} super users`)
    
    // Map regular users with collection info
    const mappedRegularUsers = regularUsers.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      verified: user.verified,
      created: user.created,
      updated: user.updated,
      roles: user.roles || [],
      collectionName: 'users', // Track which collection this user is from
      userType: 'user',
    }))
    
    // Map super users with collection info
    const mappedSuperUsers = superUsers.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      verified: user.verified,
      created: user.created,
      updated: user.updated,
      roles: user.roles || [],
      collectionName: '_superusers', // Track which collection this user is from
      userType: 'admin',
    }))
    
    // Combine both arrays
    users.value = [...mappedRegularUsers, ...mappedSuperUsers].sort((a, b) => {
      // Sort by created date descending
      return new Date(b.created) - new Date(a.created)
    })
    
    console.log('All users roles:', users.value.map(u => ({ 
      email: u.email, 
      role: u.role, 
      type: u.userType,
      roles: u.roles 
    })))
    
    if (users.value.length === 0) {
      showSnackbar('No users found in the system', 'info')
    } else {
      console.log(`✅ ${users.value.length} total users loaded (${regularUsers.length} regular, ${superUsers.length} super)`)
    }
  } catch (error) {
    console.error('❌ Error fetching users:', error)
    console.error('Error status:', error.status)
    console.error('Error response:', error.response)
    console.error('Error data:', error.data)
    console.error('Full error object:', JSON.stringify(error, null, 2))
    
    if (error.status === 403 || error.status === 401) {
      showSnackbar('Access denied. Check PocketBase API rules for users collection.', 'error')
      console.error('💡 TIP: Go to PocketBase Admin UI -> Collections -> users -> API Rules')
      console.error('💡 Set List/Search rule to: @request.auth.id != "" && @request.auth.role = 1')
    } else if (error.status === 404) {
      showSnackbar('Users collection not found', 'error')
    } else {
      showSnackbar(`Failed to load users: ${error.message || 'Unknown error'} (Status: ${error.status || 'N/A'})`, 'error')
    }
    
    users.value = []
  } finally {
    loading.value = false
    console.log('=== fetchUsers complete ===')
  }
}

const openCreateDialog = () => {
  editMode.value = false
  const defaultCategory = userCategoryOptions.find(cat => cat.value === 'studybuilder_readers')
  userFormData.value = {
    email: '',
    name: '',
    password: '',
    passwordConfirm: '',
    role: 0,
    verified: true,
    userType: 'user',
    category: 'studybuilder_readers',
    roles: defaultCategory?.roles || [],
  }
  userFormError.value = ''
  userDialog.value = true
}

const openEditDialog = (user) => {
  editMode.value = true
  selectedUser.value = user
  
  // Find the category based on current roles
  const categoryOptions = user.userType === 'admin' ? adminCategoryOptions : userCategoryOptions
  const matchingCategory = categoryOptions.find(cat => {
    // Check if roles arrays are equal
    if (!user.roles || user.roles.length === 0) return false
    if (cat.roles.length !== user.roles.length) return false
    return cat.roles.every(role => user.roles.includes(role)) && 
           user.roles.every(role => cat.roles.includes(role))
  })
  
  userFormData.value = {
    email: user.email,
    name: user.name,
    role: user.role,
    verified: user.verified,
    password: '',
    passwordConfirm: '',
    userType: user.userType,
    category: matchingCategory?.value || 'studybuilder_readers',
    roles: user.roles || [],
  }
  
  console.log('Edit user - detected category:', matchingCategory?.text || 'None', 'with roles:', user.roles)
  
  userFormError.value = ''
  userDialog.value = true
}

const closeUserDialog = () => {
  userDialog.value = false
  editMode.value = false
  selectedUser.value = null
  userFormData.value = {
    email: '',
    name: '',
    password: '',
    passwordConfirm: '',
    role: 0,
    verified: true,
    userType: 'user',
    category: 'studybuilder_readers',
    roles: [],
  }
  userFormError.value = ''
  if (userForm.value) {
    userForm.value.reset()
  }
}

const saveUser = async () => {
  userFormError.value = ''
  
  if (!userForm.value) return
  const { valid } = await userForm.value.validate()
  if (!valid) return

  submitting.value = true
  try {
    if (editMode.value) {
      // Update existing user - use the correct collection based on user type
      const collectionName = selectedUser.value.collectionName || 'users'
      
      // Get the selected category roles
      const categoryOptions = selectedUser.value.userType === 'admin' ? adminCategoryOptions : userCategoryOptions
      const selectedCategory = categoryOptions.find(cat => cat.value === userFormData.value.category)
      const updatedRoles = selectedCategory?.roles || []
      
      console.log('Updating user with:', {
        email: userFormData.value.email,
        name: userFormData.value.name,
        role: userFormData.value.role,
        verified: userFormData.value.verified,
        category: userFormData.value.category,
        roles: updatedRoles,
      })
      
      await pb.collection(collectionName).update(selectedUser.value.id, {
        email: userFormData.value.email,
        name: userFormData.value.name,
        role: userFormData.value.role,
        verified: userFormData.value.verified,
        roles: updatedRoles, // Update roles array based on selected category
      })
      
      showSnackbar(`User updated successfully (${selectedCategory?.text})`, 'success')
    } else {
      // Create new user based on type
      if (userFormData.value.userType === 'admin') {
        // Create admin user in _superusers collection
        const selectedCategory = adminCategoryOptions.find(
          cat => cat.value === userFormData.value.category
        )
        
        console.log('Creating admin user with category:', userFormData.value.category)
        console.log('Roles:', selectedCategory?.roles)
        
        const newAdmin = await pb.collection('_superusers').create({
          email: userFormData.value.email,
          emailVisibility: true,
          verified: true,
          name: userFormData.value.name,
          password: userFormData.value.password,
          passwordConfirm: userFormData.value.passwordConfirm,
          role: 1, // Admin role
          roles: selectedCategory?.roles || [], // Store roles as JSON array
        })
        
        console.log('✅ Admin user created:', newAdmin)
        showSnackbar(`Admin user created successfully (${selectedCategory?.text})`, 'success')
      } else {
        // Create regular user in users collection with roles
        const selectedCategory = userCategoryOptions.find(
          cat => cat.value === userFormData.value.category
        )
        
        console.log('Creating regular user with data:', {
          email: userFormData.value.email,
          name: userFormData.value.name,
          role: 0,
          verified: true,
          category: userFormData.value.category,
          roles: selectedCategory?.roles,
        })
        
        const newUser = await pb.collection('users').create({
          email: userFormData.value.email,
          emailVisibility: true,
          verified: true,
          name: userFormData.value.name,
          password: userFormData.value.password,
          passwordConfirm: userFormData.value.passwordConfirm,
          role: 0, // Regular user role
          roles: selectedCategory?.roles || [], // Store roles as JSON array
        })
        
        console.log('User created (initial):', newUser)
        console.log('Initial verified status:', newUser.verified)
        console.log('User roles:', newUser.roles)
        
        // Update to ensure verified = true
        console.log('Setting verified status to true...')
        try {
          const updatedUser = await pb.collection('users').update(newUser.id, {
            verified: true,
          })
          console.log('✅ User after verification update:', updatedUser)
          console.log('✅ Final verified status:', updatedUser.verified)
          showSnackbar(`User created successfully (${selectedCategory?.text})`, 'success')
        } catch (updateError) {
          console.error('❌ Failed to update verified status:', updateError)
          console.error('Update error details:', updateError.data)
          showSnackbar('User created but failed to verify. Check PocketBase update permissions.', 'warning')
        }
      }
    }
    
    await fetchUsers()
    closeUserDialog()
  } catch (error) {
    console.error('Error saving user:', error)
    console.error('Error details:', error.data)
    userFormError.value = error.message || 'Failed to save user'
  } finally {
    submitting.value = false
  }
}

const openPasswordDialog = (user) => {
  selectedUser.value = user
  newPassword.value = ''
  confirmNewPassword.value = ''
  passwordError.value = ''
  passwordDialog.value = true
}

const closePasswordDialog = () => {
  passwordDialog.value = false
  selectedUser.value = null
  newPassword.value = ''
  confirmNewPassword.value = ''
  passwordError.value = ''
  if (passwordForm.value) {
    passwordForm.value.reset()
  }
}

const resetPassword = async () => {
  passwordError.value = ''
  
  if (!passwordForm.value) return
  const { valid } = await passwordForm.value.validate()
  if (!valid) return

  resetting.value = true
  try {
    // Use the correct collection based on user type
    const collectionName = selectedUser.value.collectionName || 'users'
    await pb.collection(collectionName).update(selectedUser.value.id, {
      password: newPassword.value,
      passwordConfirm: confirmNewPassword.value,
    })
    
    showSnackbar('Password reset successfully', 'success')
    closePasswordDialog()
  } catch (error) {
    console.error('Error resetting password:', error)
    passwordError.value = error.message || 'Failed to reset password'
  } finally {
    resetting.value = false
  }
}

const toggleVerified = async (user) => {
  const newVerifiedStatus = !user.verified
  const action = newVerifiedStatus ? 'verify' : 'unverify'
  
  try {
    console.log(`Toggling verified status for ${user.email} to ${newVerifiedStatus}`)
    
    // Use the correct collection based on user type
    const collectionName = user.collectionName || 'users'
    await pb.collection(collectionName).update(user.id, {
      verified: newVerifiedStatus,
    })
    
    showSnackbar(`User ${action === 'verify' ? 'verified' : 'unverified'} successfully`, 'success')
    await fetchUsers()
  } catch (error) {
    console.error(`Error toggling verified status:`, error)
    showSnackbar(`Failed to ${action} user: ${error.message}`, 'error')
  }
}

const openDeleteDialog = (user) => {
  selectedUser.value = user
  deleteError.value = ''
  deleteDialog.value = true
}

const closeDeleteDialog = () => {
  deleteDialog.value = false
  selectedUser.value = null
  deleteError.value = ''
}

const deleteUser = async () => {
  deleteError.value = ''
  
  // Prevent deleting yourself
  if (selectedUser.value.id === currentUser.value?.id) {
    deleteError.value = 'You cannot delete your own account!'
    return
  }
  
  deleting.value = true
  try {
    console.log(`Deleting user: ${selectedUser.value.email} from ${selectedUser.value.collectionName}`)
    
    // Use the correct collection based on user type
    const collectionName = selectedUser.value.collectionName || 'users'
    await pb.collection(collectionName).delete(selectedUser.value.id)
    
    showSnackbar(`User "${selectedUser.value.email}" deleted successfully`, 'success')
    await fetchUsers()
    closeDeleteDialog()
  } catch (error) {
    console.error('Error deleting user:', error)
    deleteError.value = error.message || 'Failed to delete user'
  } finally {
    deleting.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const showSnackbar = (message, color = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  snackbar.value = true
}

const testConnection = async () => {
  try {
    console.log('=== PocketBase Connection Test ===')
    console.log('PocketBase URL:', pb.baseUrl)
    console.log('Auth Store Valid:', pb.authStore.isValid)
    console.log('Auth Token:', pb.authStore.token?.substring(0, 20) + '...')
    console.log('Current User:', pb.authStore.model)
    
    // Test health check
    const health = await fetch(pb.baseUrl + '/api/health')
    console.log('Health Check Status:', health.status)
    
    // Test collections endpoint
    const collectionsTest = await pb.send('/api/collections', {
      method: 'GET',
    }).catch(err => {
      console.log('Collections endpoint error:', err)
      return null
    })
    console.log('Collections accessible:', !!collectionsTest)
    
    // Try fetching users with detailed error
    try {
      const testUsers = await pb.collection('users').getList(1, 10, {
        sort: '-created',
      })
      console.log('✅ Users fetch successful:', testUsers)
      showSnackbar(`Success! Found ${testUsers.totalItems} users`, 'success')
      
      // Refresh the main list
      await fetchUsers()
    } catch (userError) {
      console.error('❌ Users fetch failed:', userError)
      console.error('Error status:', userError.status)
      console.error('Error data:', userError.data)
      showSnackbar(`Error: ${userError.message} (Status: ${userError.status})`, 'error')
    }
  } catch (error) {
    console.error('Connection test failed:', error)
    showSnackbar('Connection test failed: ' + error.message, 'error')
  }
}

// Watchers
// Watch category changes to update roles in real-time
watch(() => userFormData.value.category, (newCategory) => {
  if (!userDialog.value) return // Only when dialog is open
  
  const categoryOptions = editMode.value && selectedUser.value?.userType === 'admin' 
    ? adminCategoryOptions 
    : editMode.value && selectedUser.value?.userType === 'user'
    ? userCategoryOptions
    : userFormData.value.userType === 'admin'
    ? adminCategoryOptions
    : userCategoryOptions
    
  const selectedCategory = categoryOptions.find(cat => cat.value === newCategory)
  if (selectedCategory) {
    userFormData.value.roles = selectedCategory.roles
    console.log('Category changed to:', selectedCategory.text, 'Roles updated to:', selectedCategory.roles)
  }
})

// Watch user type changes in create mode to reset category and roles
watch(() => userFormData.value.userType, (newUserType) => {
  if (!userDialog.value || editMode.value) return // Only in create mode
  
  // Reset to first category of the new user type
  const defaultCategory = newUserType === 'admin' 
    ? adminCategoryOptions[0] 
    : userCategoryOptions[0]
  
  userFormData.value.category = defaultCategory.value
  userFormData.value.roles = defaultCategory.roles
  
  console.log('User type changed to:', newUserType, 'Reset category to:', defaultCategory.text)
})

// Lifecycle
onMounted(() => {
  console.log('UserManagement mounted')
  console.log('PocketBase initialized:', !!pb)
  console.log('Auth state on mount:', pb.authStore.isValid)
  console.log('Current user on mount:', currentUser.value)
  
  checkAdminAccess()
  
  // Small delay to ensure auth is fully initialized
  setTimeout(() => {
    fetchUsers()
  }, 100)
})
</script>

<style scoped>
.v-data-table {
  border-radius: 8px;
}
</style>


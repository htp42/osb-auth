<template>
  <v-container fluid class="pa-6">
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card class="mx-auto" elevation="4">
          <v-card-title class="d-flex align-center pa-6 bg-primary">
            <v-icon class="mr-3" size="large" color="white">mdi-account-cog</v-icon>
            <span class="text-h4 text-white">Profile Settings</span>
          </v-card-title>

          <v-divider />

          <!-- User Info Card -->
          <v-card-text class="pa-6">
            <v-card variant="tonal" color="info" class="mb-6">
              <v-card-text>
                <div class="d-flex align-center">
                  <v-avatar color="primary" size="64" class="mr-4">
                    <v-icon size="40" color="white">mdi-account-circle</v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-h6">{{ currentUser?.name || 'User' }}</div>
                    <div class="text-body-2 text-grey-darken-1">{{ currentUser?.email }}</div>
                    <div class="mt-2">
                      <v-chip 
                        size="small" 
                        :color="isSuperuser ? 'purple' : (currentUser?.role === 1 ? 'error' : 'primary')" 
                        class="mr-2"
                      >
                        <v-icon start size="small">
                          {{ isSuperuser ? 'mdi-shield-star' : (currentUser?.role === 1 ? 'mdi-shield-crown' : 'mdi-account') }}
                        </v-icon>
                        {{ isSuperuser ? 'Admin' : (currentUser?.role === 1 ? 'Admin' : 'User') }}
                      </v-chip>
                   
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <!-- Update Name Form -->
            <v-card variant="outlined" class="mb-4">
              <v-card-title class="bg-grey-lighten-4">
                <v-icon class="mr-2">mdi-account-edit</v-icon>
                Update Name
              </v-card-title>
              <v-card-text class="pt-4">
                <v-form ref="nameForm" v-model="nameFormValid" @submit.prevent="updateName">
                  <v-text-field
                    v-model="nameFormData.name"
                    label="Full Name"
                    :rules="nameRules"
                    prepend-inner-icon="mdi-account"
                    variant="outlined"
                    required
                  />
                  
                  <v-alert v-if="nameError" type="error" variant="tonal" class="mb-3">
                    {{ nameError }}
                  </v-alert>
                  
                  <v-alert v-if="nameSuccess" type="success" variant="tonal" class="mb-3">
                    {{ nameSuccess }}
                  </v-alert>

                  <div class="d-flex justify-end">
                    <v-btn
                      type="submit"
                      color="primary"
                      :loading="updatingName"
                      :disabled="!nameFormValid"
                    >
                      <v-icon start>mdi-content-save</v-icon>
                      Update Name
                    </v-btn>
                  </div>
                </v-form>
              </v-card-text>
            </v-card>

            <!-- Change Password Form -->
            <v-card variant="outlined">
              <v-card-title class="bg-grey-lighten-4">
                <v-icon class="mr-2">mdi-lock-reset</v-icon>
                Change Password
              </v-card-title>
              <v-card-text class="pt-4">
                <v-form ref="passwordForm" v-model="passwordFormValid" @submit.prevent="changePassword">
                  <v-text-field
                    v-model="passwordFormData.currentPassword"
                    label="Current Password"
                    :type="showCurrentPassword ? 'text' : 'password'"
                    :rules="currentPasswordRules"
                    prepend-inner-icon="mdi-lock"
                    :append-inner-icon="showCurrentPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showCurrentPassword = !showCurrentPassword"
                    variant="outlined"
                    required
                    class="mb-3"
                  />

                  <v-text-field
                    v-model="passwordFormData.newPassword"
                    label="New Password"
                    :type="showNewPassword ? 'text' : 'password'"
                    :rules="newPasswordRules"
                    prepend-inner-icon="mdi-lock-outline"
                    :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showNewPassword = !showNewPassword"
                    variant="outlined"
                    required
                    class="mb-3"
                  />

                  <v-text-field
                    v-model="passwordFormData.confirmPassword"
                    label="Confirm New Password"
                    :type="showNewPassword ? 'text' : 'password'"
                    :rules="confirmPasswordRules"
                    prepend-inner-icon="mdi-lock-check"
                    variant="outlined"
                    required
                    class="mb-3"
                  />

                  <v-alert type="info" variant="tonal" density="compact" class="mb-3">
                    Password must be at least 8 characters long
                  </v-alert>
                  
                  <v-alert v-if="passwordError" type="error" variant="tonal" class="mb-3">
                    {{ passwordError }}
                  </v-alert>
                  
                  <v-alert v-if="passwordSuccess" type="success" variant="tonal" class="mb-3">
                    {{ passwordSuccess }}
                  </v-alert>

                  <div class="d-flex justify-end">
                    <v-btn
                      type="submit"
                      color="warning"
                      :loading="updatingPassword"
                      :disabled="!passwordFormValid"
                    >
                      <v-icon start>mdi-lock-reset</v-icon>
                      Change Password
                    </v-btn>
                  </div>
                </v-form>
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { pb, currentUser } from '@/utils/pocketbase'

console.log('🚀 ProfilePage.vue script loaded')

const router = useRouter()

// Computed
const isSuperuser = computed(() => {
  return currentUser.value?.collectionName === '_superusers'
})

// Data
const nameFormValid = ref(false)
const passwordFormValid = ref(false)
const updatingName = ref(false)
const updatingPassword = ref(false)
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const nameError = ref('')
const nameSuccess = ref('')
const passwordError = ref('')
const passwordSuccess = ref('')
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// Form refs
const nameForm = ref(null)
const passwordForm = ref(null)

// Form data
const nameFormData = ref({
  name: '',
})

const passwordFormData = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// Validation rules
const nameRules = [
  (v) => !!v || 'Name is required',
  (v) => (v && v.length >= 2) || 'Name must be at least 2 characters',
]

const currentPasswordRules = [
  (v) => !!v || 'Current password is required',
]

const newPasswordRules = [
  (v) => !!v || 'New password is required',
  (v) => (v && v.length >= 8) || 'Password must be at least 8 characters',
]

const confirmPasswordRules = [
  (v) => !!v || 'Please confirm your new password',
  (v) => v === passwordFormData.value.newPassword || 'Passwords do not match',
]

// Methods
const loadUserData = () => {
  if (currentUser.value) {
    nameFormData.value.name = currentUser.value.name || ''
  }
}

const updateName = async () => {
  nameError.value = ''
  nameSuccess.value = ''
  
  if (!nameForm.value) return
  const { valid } = await nameForm.value.validate()
  if (!valid) return

  updatingName.value = true
  try {
    console.log('Updating user name to:', nameFormData.value.name)
    console.log('User type:', isSuperuser.value ? 'Superuser' : 'Regular User')
    
    // Use appropriate collection based on user type
    const collection = isSuperuser.value ? '_superusers' : 'users'
    
    const updatedRecord = await pb.collection(collection).update(currentUser.value.id, {
      name: nameFormData.value.name,
    })
    
    console.log('✅ Name updated, new record:', updatedRecord)
    
    // Update the currentUser ref with the fresh data
    currentUser.value = updatedRecord
    
    console.log('✅ currentUser.value updated to:', currentUser.value.name)
    
    nameSuccess.value = 'Name updated successfully!'
    showSnackbar('Name updated successfully!', 'success')
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      nameSuccess.value = ''
    }, 3000)
  } catch (error) {
    console.error('Error updating name:', error)
    nameError.value = error.message || 'Failed to update name'
  } finally {
    updatingName.value = false
  }
}

const changePassword = async () => {
  passwordError.value = ''
  passwordSuccess.value = ''
  
  if (!passwordForm.value) return
  const { valid } = await passwordForm.value.validate()
  if (!valid) return

  updatingPassword.value = true
  try {
    console.log('Updating password...')
    console.log('User type:', isSuperuser.value ? 'Superuser (_superusers)' : 'Regular User (users)')
    
    // Use appropriate collection based on user type
    const collection = isSuperuser.value ? '_superusers' : 'users'
    
    // Update password using the appropriate collection
    // PocketBase requires oldPassword field and will verify it automatically
    await pb.collection(collection).update(currentUser.value.id, {
      oldPassword: passwordFormData.value.currentPassword,
      password: passwordFormData.value.newPassword,
      passwordConfirm: passwordFormData.value.confirmPassword,
    })
    
    console.log('✅ Password updated successfully in', collection, 'collection')
    
    passwordSuccess.value = 'Password changed successfully!'
    showSnackbar('Password changed successfully!', 'success')
    
    // Clear form
    passwordFormData.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
    passwordForm.value.reset()
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      passwordSuccess.value = ''
    }, 3000)
  } catch (error) {
    console.error('Error changing password:', error)
    
    // Handle specific PocketBase error for wrong old password
    if (error?.data?.data?.oldPassword) {
      passwordError.value = 'Current password is incorrect'
    } else if (error?.message) {
      passwordError.value = error.message
    } else {
      passwordError.value = 'Failed to change password'
    }
  } finally {
    updatingPassword.value = false
  }
}

const showSnackbar = (message, color = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  snackbar.value = true
}

// Lifecycle
onMounted(() => {
  console.log('ProfilePage mounted')
  console.log('PocketBase auth valid:', pb.authStore.isValid)
  console.log('Current user:', currentUser.value)
  
  if (!pb.authStore.isValid) {
    console.log('❌ Not authenticated, redirecting to login...')
    router.push({ name: 'Login' })
    return
  }
  
  console.log('✅ Loading user data for profile...')
  loadUserData()
})
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}
</style>


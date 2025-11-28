# PocketBase User Management Setup Guide

## ✅ What Was Fixed

### 1. **PocketBase Configuration** (`src/utils/pocketbase.js`)
- ✅ Initialized `currentUser` with `pb.authStore.model` for immediate reactivity
- ✅ Updated `onChange` handler to use `model` parameter
- ✅ Fixed `restoreAuth()` to use `pb.authStore.model`

### 2. **User Management Page** (`src/views/UserManagement.vue`)
- ✅ Added authentication check before fetching
- ✅ Proper error handling with specific status code checks
- ✅ Clean mapping of user objects (id, email, name, role, verified, created)
- ✅ Console logging for debugging
- ✅ User-friendly error messages via snackbar

---

## 🔧 Required: PocketBase Collection Rules Setup

**IMPORTANT**: You must configure PocketBase collection rules to allow admin users to view all users.

### Step-by-Step Instructions:

1. **Open PocketBase Admin UI**
   - Navigate to: `http://127.0.0.1:8090/_/`
   - Login with your admin credentials

2. **Go to Collections**
   - Click on **Collections** in the left sidebar
   - Find and click on the **users** collection

3. **Configure API Rules** (Click on "API Rules" tab)

   **List/Search rule** (allows listing all users):
   ```javascript
   @request.auth.id != "" && @request.auth.role = 1
   ```
   ✅ This allows authenticated users with role = 1 (admin) to list all users

   **View rule** (allows viewing individual users):
   ```javascript
   @request.auth.id != "" && (@request.auth.id = id || @request.auth.role = 1)
   ```
   ✅ This allows users to view their own record OR admin users to view any record

   **Create rule** (allows admins to create users):
   ```javascript
   @request.auth.role = 1
   ```
   ✅ Only admin users can create new users

   **Update rule** (allows admins to update users):
   ```javascript
   @request.auth.role = 1 || @request.auth.id = id
   ```
   ✅ Admin users can update any user, or users can update themselves

   **Delete rule** (optional - allows admins to delete users):
   ```javascript
   @request.auth.role = 1
   ```
   ✅ Only admin users can delete users

4. **Click Save**

---

## 🎯 How It Works

### Fetching Users
```javascript
const fetchUsers = async () => {
  // 1. Check authentication
  if (!pb.authStore.isValid) {
    // Redirect to login
  }
  
  // 2. Fetch all users from PocketBase
  const records = await pb.collection('users').getFullList({
    sort: '-created',  // Newest first
  })
  
  // 3. Map to clean objects
  users.value = records.map(user => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    verified: user.verified,
    created: user.created,
  }))
}
```

### Access Control
- ✅ Router guard checks `role = 1` before allowing access
- ✅ Component-level check on mount
- ✅ PocketBase API rules enforce permissions

---

## 📊 User Data Table Columns

| Column | Description | Icon |
|--------|-------------|------|
| **Email** | User's email address | ✅ Green check (verified) / ⚠️ Orange alert (unverified) |
| **Name** | User's display name | - |
| **Role** | Admin (1) or User (0) | 👑 Admin badge / 👤 User badge |
| **Created** | Account creation date | - |
| **Actions** | Edit / Reset Password | 🔒 ✏️ |

---

## 🧪 Testing

### 1. Login as Admin
- Login with a user that has `role = 1`
- Navigate to `/administration/users`

### 2. Check Console Output
Open browser console (F12) and look for:
```
Fetching users from PocketBase...
Current admin user: { id: "...", role: 1, ... }
Auth token present: true
✅ Successfully fetched X users
```

### 3. Verify Table Display
- All users should appear in the table
- Verified status icons should show correctly
- Role badges should display (Admin/User)

### 4. Test User Creation
- Click "Create New User"
- Fill in: email, name, password, role
- Toggle "Email Verified" as needed
- Click "Create"

---

## 🐛 Troubleshooting

### ❌ "Access denied. Admin privileges required."
**Cause**: User's role is not 1, or PocketBase API rules are not configured

**Solution**:
1. Check user role in PocketBase Admin UI
2. Verify API rules are set correctly (see above)
3. Make sure you're logged in

### ❌ "Failed to load users: Failed to fetch"
**Cause**: PocketBase server is not running

**Solution**:
```bash
# Start PocketBase
cd path/to/pocketbase
./pocketbase serve
```

### ❌ Users table is empty but no error
**Cause**: No users exist in the database OR API rules prevent access

**Solution**:
1. Create a test user in PocketBase Admin UI
2. Verify API rules (List/Search rule must allow admin access)
3. Check browser console for errors

### ❌ "Values don't match" error when creating users
**Cause**: Trying to set `verified` field during creation

**Solution**: ✅ Already fixed! The code creates user first, then updates `verified` field

---

## 🎉 Features Implemented

- ✅ Fetch all users from `_pb_users_auth_` (via `users` collection)
- ✅ Display in Vuetify data table with sorting and pagination
- ✅ Show verified status with icons
- ✅ Role badges (Admin/User)
- ✅ Admin-only access control
- ✅ Create new users with role selection
- ✅ Edit existing users
- ✅ Reset user passwords
- ✅ Proper error handling and user feedback
- ✅ Reactive authentication state

---

## 📝 Quick Reference: PocketBase Users Collection

**Collection Name**: `users` (maps to `_pb_users_auth_`)

**Fields**:
- `id` - Unique identifier
- `email` - User's email address
- `name` - Display name
- `role` - 0 = User, 1 = Admin
- `verified` - Boolean (email verification status)
- `created` - Timestamp
- `updated` - Timestamp
- `password` - Hashed (not returned in queries)

**SDK Methods**:
```javascript
// List all users
pb.collection('users').getFullList()

// Get one user
pb.collection('users').getOne(id)

// Create user
pb.collection('users').create(data)

// Update user
pb.collection('users').update(id, data)

// Delete user
pb.collection('users').delete(id)
```

---

## 🚀 Next Steps

1. Configure PocketBase API rules (see above)
2. Login as admin user (role = 1)
3. Navigate to **Administration** → **User Management**
4. Verify users are displayed
5. Test creating/editing users

**Need Help?** Check browser console for detailed error messages!


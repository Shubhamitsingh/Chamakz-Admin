# 🚀 InterniX Admin Dashboard - Quick Start Guide

## ⚡ Get Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Open in Browser
Navigate to: **http://localhost:5173**

---

## 📋 Default Admin Credentials (Mock)
- **Email**: admin@internix.com
- **Name**: Admin User

---

## 🎯 Quick Feature Overview

### Sidebar Navigation
Click any menu item to navigate:
- **Dashboard** - Analytics overview
- **Users** - Manage users
- **Wallet** - Coin transactions
- **Tickets** - Support tickets
- **Chats** - Live chat
- **Approvals** - Pending accounts
- **Resellers** - Reseller management
- **Content** - Banners & announcements
- **Settings** - App configuration

### Key Features to Try

#### 🌙 Dark Mode
Click the **moon/sun icon** in the top-right corner

#### 🔍 Search
Use the search bar in the top navigation

#### 📊 Dashboard
- View real-time stats
- Interactive charts
- Recent activity feed

#### 👥 Users Page
- Search users
- Filter by status (Active/Blocked)
- Click user row to view details
- Block/Activate users

#### 💰 Wallet Page
- Click "Add Transaction" button
- Select Credit or Debit
- Choose user and amount
- View transaction history

#### 🎫 Tickets Page
- Filter by status (Open/Pending/Resolved)
- Click eye icon to view ticket details
- Mark tickets as Pending or Resolved

#### 💬 Chats Page
- Click on a user from the left panel
- View message history
- Type and send messages

#### ✅ Approvals Page
- View pending account registrations
- Approve or reject applications

#### 🏪 Resellers Page
- View reseller performance
- Click eye icon for detailed stats

#### 📢 Content Management
- Add new banners with images
- Create announcements
- Delete old banners

#### ⚙️ Settings
- Update app name and logo
- Change admin profile
- Toggle notifications
- Backup/Reset system

---

## 🎨 Customization

### Change Colors
Edit `tailwind.config.js`:
```javascript
colors: {
  primary: {
    500: '#YOUR_COLOR',  // Main green
  },
  secondary: {
    500: '#YOUR_COLOR',  // Main blue
  },
}
```

### Update Mock Data
Edit `src/utils/mockData.js` to change sample data

### Connect Real API
Update methods in `src/context/AppContext.jsx`:
```javascript
const updateUser = async (userId, updates) => {
  // Replace with your API call
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  })
  // ... rest of the code
}
```

---

## 📱 Responsive Design

The dashboard works perfectly on:
- 📱 **Mobile** (< 768px)
- 📲 **Tablet** (768px - 1024px)
- 💻 **Desktop** (> 1024px)

Try resizing your browser to see responsive behavior!

---

## 🔥 Pro Tips

1. **Sidebar Toggle**: Click the arrow icon to collapse/expand sidebar
2. **Toast Notifications**: Actions show success/error toasts (top-right)
3. **Dark Mode Persists**: Your theme preference is saved
4. **Keyboard Navigation**: Use Tab to navigate through forms
5. **Real-time Updates**: All actions update the UI instantly

---

## 🐛 Troubleshooting

### Port Already in Use?
```bash
# Kill the process on port 5173
npx kill-port 5173

# Or use a different port
npm run dev -- --port 3000
```

### Dependencies Not Installing?
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Not Working?
```bash
# Clean build
rm -rf dist
npm run build
```

---

## 📦 Build for Production

```bash
# Create optimized production build
npm run build

# Preview the production build
npm run preview
```

Build output will be in the `dist` folder.

---

## 🎉 You're All Set!

Start exploring the dashboard and customize it for your needs!

For detailed documentation, see **README.md**

**Need help?** support@internix.com




















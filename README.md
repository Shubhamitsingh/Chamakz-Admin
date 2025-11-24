# 💼 Chamak Admin Dashboard

A modern, responsive, and feature-rich admin dashboard built with **React.js**, **Tailwind CSS**, and **Framer Motion**. Designed for managing the Chamak Admin app ecosystem with a clean, futuristic UI.

![Chamak Admin Dashboard](https://via.placeholder.com/1200x600/22c55e/ffffff?text=Chamak+Admin+Dashboard)

## 🎯 Features

### 📊 Dashboard
- **Real-time Analytics Cards**: Total Users, Coins, Tickets, Chats, Pending Approvals
- **Interactive Charts**: User activity (Line Chart) and Coin transactions (Bar Chart)
- **Recent Activity Feed**: Last 10 user actions with visual indicators

### 👥 Users Management
- Dynamic table with search and filters (Active/Blocked/Reseller)
- User profile modal with detailed information
- Block/Activate user functionality
- Responsive design with smooth animations

### 💰 Wallet & Coin Management
- Add/Deduct coins for users
- Transaction history with filters
- Real-time statistics (Total Coins, Credits, Debits)
- Dynamic transaction modal

### 🎫 Ticket Support
- Status tracking (Open, Pending, Resolved)
- Priority levels (High, Medium, Low)
- Ticket detail modal with action buttons
- Filter by status and search functionality

### 💬 Chat Management
- Two-column layout (Chat list + Chat window)
- Real-time style UI with message history
- Unread message indicators
- Placeholder for AI auto-reply feature

### 🏷️ Account Approvals
- Pending account registrations
- Approve/Reject functionality
- Document verification status
- Filter by User/Reseller type

### 🏪 Reseller Management
- Performance tracking dashboard
- Revenue and coin sales statistics
- Detailed reseller profile modal
- Rating system (1-5 stars)

### 📢 Content Management
- Banner upload with image preview
- Active/Inactive banner status
- Announcements with priority levels
- Delete and update functionality

### ⚙️ Settings
- General app settings
- Admin profile management
- Dark/Light mode toggle
- Notification preferences
- System management (Backup, Reset)

## 🎨 Design Features

- **Color Theme**: Green (#22c55e) & Sky Blue (#0ea5e9) - Chamak Admin branding
- **Animations**: Smooth transitions with Framer Motion
- **Icons**: Lucide React icons throughout
- **Responsive**: Mobile-first design approach
- **Dark Mode**: Full dark mode support with persistent storage
- **Modern UI**: Rounded corners, soft shadows, gradient accents

## 🛠️ Tech Stack

- **Frontend Framework**: React 18.3
- **Build Tool**: Vite 5.4
- **Styling**: Tailwind CSS 3.4
- **Animations**: Framer Motion 11.3
- **Charts**: Recharts 2.12
- **Icons**: Lucide React 0.428
- **Routing**: React Router DOM 6.26
- **State Management**: React Context API

## 📁 Project Structure

```
src/
├── components/          # Reusable components
│   ├── Modal.jsx
│   ├── Table.jsx
│   ├── Toast.jsx
│   ├── Loader.jsx
│   ├── StatCard.jsx
│   └── SearchBar.jsx
├── pages/              # Page components
│   ├── Dashboard.jsx
│   ├── Users.jsx
│   ├── Wallet.jsx
│   ├── Tickets.jsx
│   ├── Chats.jsx
│   ├── Approvals.jsx
│   ├── Resellers.jsx
│   ├── ContentManagement.jsx
│   └── Settings.jsx
├── layouts/            # Layout components
│   ├── MainLayout.jsx
│   ├── Sidebar.jsx
│   └── TopNav.jsx
├── context/            # Context API for state
│   └── AppContext.jsx
├── utils/              # Utility functions and mock data
│   └── mockData.js
├── App.jsx             # Main App component
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd Chamak-Admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## 🎯 Features Breakdown

### Navigation
- **Collapsible Sidebar**: Smooth expand/collapse animation
- **Active Route Highlighting**: Visual indicator for current page
- **Responsive Mobile Menu**: Hamburger menu for mobile devices

### Data Management
- **Mock Data**: Pre-populated with realistic sample data
- **Context API**: Centralized state management
- **Dynamic Updates**: Real-time UI updates on data changes

### User Experience
- **Toast Notifications**: Success/Error messages with auto-dismiss
- **Loading States**: Smooth loading indicators
- **Modal Dialogs**: For detailed views and actions
- **Search & Filters**: Advanced filtering across all tables

## 🔌 API Integration Ready

All components are designed to easily integrate with real APIs:

```javascript
// Example: Update user in real API
const updateUser = async (userId, updates) => {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  })
  const data = await response.json()
  // Update local state
  setData(prev => ({
    ...prev,
    users: prev.users.map(user => 
      user.id === userId ? { ...user, ...data } : user
    )
  }))
}
```

## 🎨 Customization

### Colors
Edit `tailwind.config.js` to change the color scheme:

```javascript
colors: {
  primary: { /* Your primary colors */ },
  secondary: { /* Your secondary colors */ },
}
```

### Dark Mode
Dark mode is automatically detected and saved to localStorage. Toggle via the sun/moon icon in the top navigation.

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔒 Security Considerations

For production deployment:
- Implement proper authentication (JWT, OAuth)
- Add role-based access control (RBAC)
- Sanitize user inputs
- Use HTTPS
- Implement CSRF protection
- Add rate limiting

## 🚧 Future Enhancements

- [ ] Real-time WebSocket support for chat
- [ ] AI-powered auto-reply in chat
- [ ] Advanced analytics with more chart types
- [ ] Export data to CSV/Excel
- [ ] Multi-language support (i18n)
- [ ] Email templates for notifications
- [ ] Activity logs and audit trail
- [ ] Two-factor authentication (2FA)

## 📄 License

This project is built for Chamak Admin. All rights reserved.

## 👨‍💻 Development

Built with ❤️ using modern web technologies.

### Contributing

For feature requests or bug reports, please create an issue in the repository.

---

**Note**: This is a frontend-only dashboard with mock data. Connect to your backend API by updating the Context API methods in `src/context/AppContext.jsx`.

## 🎉 Happy Coding!

For questions or support, contact: support@chamakadmin.com



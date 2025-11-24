export const mockData = {
  stats: {
    totalUsers: 15420,
    totalCoins: 2450000,
    activeTickets: 47,
    ongoingChats: 23,
    pendingApprovals: 12,
  },
  
  users: [
    { id: 1001234, name: 'Rahul Sharma', email: 'rahul@example.com', role: 'User', status: 'Active', coins: 1500, joinDate: '2024-01-15', lastActive: '2 hours ago' },
    { id: 1002345, name: 'Priya Singh', email: 'priya@example.com', role: 'User', status: 'Active', coins: 2300, joinDate: '2024-02-20', lastActive: '1 day ago' },
    { id: 1003456, name: 'Amit Kumar', email: 'amit@example.com', role: 'Reseller', status: 'Active', coins: 5000, joinDate: '2023-12-10', lastActive: '5 mins ago' },
    { id: 1004567, name: 'Sneha Patel', email: 'sneha@example.com', role: 'User', status: 'Blocked', coins: 500, joinDate: '2024-03-05', lastActive: '1 week ago' },
    { id: 1005678, name: 'Vikram Mehta', email: 'vikram@example.com', role: 'User', status: 'Active', coins: 3200, joinDate: '2024-01-28', lastActive: '3 hours ago' },
    { id: 1006789, name: 'Anjali Verma', email: 'anjali@example.com', role: 'Reseller', status: 'Active', coins: 7500, joinDate: '2023-11-15', lastActive: '30 mins ago' },
    { id: 1007890, name: 'Rohan Gupta', email: 'rohan@example.com', role: 'User', status: 'Active', coins: 1800, joinDate: '2024-02-14', lastActive: '2 days ago' },
    { id: 1008901, name: 'Kavya Reddy', email: 'kavya@example.com', role: 'User', status: 'Active', coins: 2100, joinDate: '2024-03-01', lastActive: '6 hours ago' },
  ],

  transactions: [
    { id: 1, user: 'Rahul Sharma', type: 'Credit', amount: 500, date: '2024-11-07', time: '10:30 AM', reason: 'Purchase' },
    { id: 2, user: 'Priya Singh', type: 'Debit', amount: 200, date: '2024-11-07', time: '09:15 AM', reason: 'Withdrawal' },
    { id: 3, user: 'Amit Kumar', type: 'Credit', amount: 1000, date: '2024-11-06', time: '04:20 PM', reason: 'Bonus' },
    { id: 4, user: 'Vikram Mehta', type: 'Credit', amount: 300, date: '2024-11-06', time: '02:45 PM', reason: 'Referral' },
    { id: 5, user: 'Anjali Verma', type: 'Debit', amount: 750, date: '2024-11-05', time: '11:00 AM', reason: 'Purchase' },
    { id: 6, user: 'Kavya Reddy', type: 'Credit', amount: 450, date: '2024-11-05', time: '08:30 AM', reason: 'Reward' },
  ],

  tickets: [
    { id: 1, ticketId: 'TKT-1001', username: 'Rahul Sharma', email: 'rahul@example.com', issue: 'Cannot withdraw coins', status: 'Open', priority: 'High', created: '2024-11-07', assignedTo: 'Admin' },
    { id: 2, ticketId: 'TKT-1002', username: 'Priya Singh', email: 'priya@example.com', issue: 'Account verification pending', status: 'Pending', priority: 'Medium', created: '2024-11-06', assignedTo: 'Support' },
    { id: 3, ticketId: 'TKT-1003', username: 'Vikram Mehta', email: 'vikram@example.com', issue: 'Payment not reflected', status: 'Open', priority: 'High', created: '2024-11-06', assignedTo: 'Admin' },
    { id: 4, ticketId: 'TKT-1004', username: 'Rohan Gupta', email: 'rohan@example.com', issue: 'Profile update issue', status: 'Resolved', priority: 'Low', created: '2024-11-05', assignedTo: 'Support' },
    { id: 5, ticketId: 'TKT-1005', username: 'Kavya Reddy', email: 'kavya@example.com', issue: 'Referral code not working', status: 'Pending', priority: 'Medium', created: '2024-11-04', assignedTo: 'Admin' },
  ],

  chats: [
    { id: 1, username: 'Rahul Sharma', lastMessage: 'When will my withdrawal be processed?', time: '5 mins ago', unread: 2, avatar: 'RS' },
    { id: 2, username: 'Priya Singh', lastMessage: 'Thanks for the help!', time: '1 hour ago', unread: 0, avatar: 'PS' },
    { id: 3, username: 'Amit Kumar', lastMessage: 'Need more coin inventory', time: '2 hours ago', unread: 1, avatar: 'AK' },
    { id: 4, username: 'Anjali Verma', lastMessage: 'Payment details updated', time: '3 hours ago', unread: 0, avatar: 'AV' },
    { id: 5, username: 'Vikram Mehta', lastMessage: 'Issue with transaction', time: '1 day ago', unread: 3, avatar: 'VM' },
  ],

  messages: {
    1: [
      { id: 1, sender: 'user', text: 'Hello, I need help with my withdrawal', time: '10:30 AM' },
      { id: 2, sender: 'admin', text: 'Hi Rahul! I can help you with that. What seems to be the issue?', time: '10:32 AM' },
      { id: 3, sender: 'user', text: 'My withdrawal request has been pending for 2 days', time: '10:33 AM' },
      { id: 4, sender: 'admin', text: 'Let me check your account. Please give me a moment.', time: '10:34 AM' },
      { id: 5, sender: 'user', text: 'When will my withdrawal be processed?', time: '10:40 AM' },
    ],
  },

  pendingApprovals: [
    { id: 2001234, name: 'Arjun Singh', email: 'arjun@example.com', type: 'Reseller', appliedDate: '2024-11-07', documents: 'Verified', status: 'pending' },
    { id: 2002345, name: 'Meera Joshi', email: 'meera@example.com', type: 'User', appliedDate: '2024-11-07', documents: 'Pending', status: 'pending' },
    { id: 2003456, name: 'Karan Malhotra', email: 'karan@example.com', type: 'Reseller', appliedDate: '2024-11-06', documents: 'Verified', status: 'pending' },
    { id: 2004567, name: 'Neha Kapoor', email: 'neha@example.com', type: 'User', appliedDate: '2024-11-06', documents: 'Verified', status: 'pending' },
  ],

  resellers: [
    { id: 3001234, name: 'Amit Kumar', email: 'amit@example.com', region: 'North India', coinsSold: 45000, revenue: 225000, status: 'Active', joinDate: '2023-12-10', performance: 'Excellent' },
    { id: 3002345, name: 'Anjali Verma', email: 'anjali@example.com', region: 'West India', coinsSold: 38000, revenue: 190000, status: 'Active', joinDate: '2023-11-15', performance: 'Good' },
    { id: 3003456, name: 'Sanjay Patel', email: 'sanjay@example.com', region: 'South India', coinsSold: 52000, revenue: 260000, status: 'Active', joinDate: '2023-10-20', performance: 'Excellent' },
    { id: 3004567, name: 'Divya Sharma', email: 'divya@example.com', region: 'East India', coinsSold: 31000, revenue: 155000, status: 'Active', joinDate: '2024-01-05', performance: 'Average' },
  ],

  banners: [
    { id: 1, title: 'New Feature Launch', image: 'https://via.placeholder.com/800x200/22c55e/ffffff?text=New+Feature+Launch', active: true, startDate: '2024-11-01', endDate: '2024-11-30' },
    { id: 2, title: 'Holiday Offer', image: 'https://via.placeholder.com/800x200/0ea5e9/ffffff?text=Holiday+Offer', active: true, startDate: '2024-11-05', endDate: '2024-12-25' },
    { id: 3, title: 'Maintenance Notice', image: 'https://via.placeholder.com/800x200/ef4444/ffffff?text=Maintenance+Notice', active: false, startDate: '2024-10-15', endDate: '2024-10-20' },
  ],

  announcements: [
    { id: 1, title: 'System Maintenance', message: 'Scheduled maintenance on Nov 15, 2024 from 2 AM to 4 AM', date: '2024-11-05', priority: 'High' },
    { id: 2, title: 'New Reseller Program', message: 'Exciting new benefits for reseller partners', date: '2024-11-03', priority: 'Medium' },
    { id: 3, title: 'App Update v2.5', message: 'New features and improvements available now', date: '2024-11-01', priority: 'Low' },
  ],

  recentActivity: [
    { id: 1, user: 'Rahul Sharma', action: 'Purchased 500 coins', time: '5 mins ago', type: 'purchase' },
    { id: 2, user: 'Priya Singh', action: 'Withdrew 200 coins', time: '15 mins ago', type: 'withdrawal' },
    { id: 3, user: 'Amit Kumar', action: 'Logged in', time: '30 mins ago', type: 'login' },
    { id: 4, user: 'Vikram Mehta', action: 'Updated profile', time: '1 hour ago', type: 'update' },
    { id: 5, user: 'Anjali Verma', action: 'Created ticket', time: '2 hours ago', type: 'ticket' },
    { id: 6, user: 'Kavya Reddy', action: 'Referral completed', time: '3 hours ago', type: 'referral' },
    { id: 7, user: 'Rohan Gupta', action: 'Purchased 300 coins', time: '4 hours ago', type: 'purchase' },
    { id: 8, user: 'Sneha Patel', action: 'Account blocked', time: '5 hours ago', type: 'security' },
  ],

  chartData: {
    userActivity: [
      { name: 'Mon', users: 120, active: 85 },
      { name: 'Tue', users: 145, active: 92 },
      { name: 'Wed', users: 168, active: 110 },
      { name: 'Thu', users: 132, active: 88 },
      { name: 'Fri', users: 189, active: 125 },
      { name: 'Sat', users: 201, active: 145 },
      { name: 'Sun', users: 178, active: 120 },
    ],
    coinTransactions: [
      { name: 'Jan', credits: 45000, debits: 32000 },
      { name: 'Feb', credits: 52000, debits: 38000 },
      { name: 'Mar', credits: 61000, debits: 42000 },
      { name: 'Apr', credits: 58000, debits: 45000 },
      { name: 'May', credits: 67000, debits: 48000 },
      { name: 'Jun', credits: 72000, debits: 51000 },
      { name: 'Jul', credits: 78000, debits: 55000 },
      { name: 'Aug', credits: 84000, debits: 59000 },
      { name: 'Sep', credits: 89000, debits: 62000 },
      { name: 'Oct', credits: 95000, debits: 67000 },
      { name: 'Nov', credits: 102000, debits: 71000 },
    ],
  },
}



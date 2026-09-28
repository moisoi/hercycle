const db = require('../db.json'); // Will be created

// Get all users
exports.getUsers = () => db.users;

// Find user by email
exports.findUserByEmail = async (email) => {
  return db.users.find(u => u.email === email);
};

// Create new user
exports.createUser = async (userData) => {
  const newUser = {
    id: db.users.length + 1,
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  db.users.push(newUser);
  return newUser;
};

// Find user by ID
exports.findUserById = (id) => db.users.find(u => u.id === id);

// Update user
exports.updateUser = (id, updateData) => {
  const user = db.users.find(u => u.id === id);
  if (!user) return null;
  
  Object.assign(user, updateData, { updatedAt: new Date() });
  return user;
};
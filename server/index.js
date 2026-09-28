const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve('client/build', 'index.html'));
  });
}

// ==========================================
// DATABASE INITIALIZATION
// ==========================================

const dbPath = path.join(__dirname, 'db.json');
let db = { users: [], cycles: [], intimacyLogs: [], quests: [] };

if (fs.existsSync(dbPath)) {
  db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

// Ensure default data exists
if (db.quests.length === 0) {
  db.quests = [
    {
      id: 1,
      title: 'Log mood 4 days this week',
      description: 'Unlock your PMS pattern card',
      target: 4,
      reward: 50,
      completed: false
    },
    {
      id: 2,
      title: 'Try one new self-care activity',
      description: 'Earn the Self-Care Sorcerer badge',
      target: 1,
      reward: 100,
      completed: false
    },
    {
      id: 3,
      title: 'Complete 5 cycle logs',
      description: 'Earn the Cycle Keeper badge',
      target: 5,
      reward: 75,
      completed: false
    }
  ];
}

// Save db periodically (simple approach for demo)
const saveDb = () => {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
};

// ==========================================
// AUTH MIDDLEWARE
// ==========================================

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, 'hercycle-secret-key');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token.' });
  }
}

// ==========================================
// AUTH ROUTES
// ==========================================

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check if user already exists
    const existingUser = db.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists.' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = {
      id: db.users.length + 1,
      username,
      email,
      password: hashedPassword,
      onboardingCompleted: false,
      phase: 'menstrual',
      cycleDay: 1,
      coins: 0,
      level: 1,
      streak: 0,
      completedQuests: [],
    };

    db.users.push(user);
    saveDb();
    
    // Generate JWT
    const token = jwt.sign({ id: user.id, username: user.username }, 'hercycle-secret-key', { expiresIn: '7d' });
    
    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phase: user.phase,
        coins: user.coins,
        level: user.level,
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = db.users.find(u => u.email === email);
    if (!user) return res.status(400).json({ error: 'User not found.' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password.' });

    const token = jwt.sign({ id: user.id, username: user.username }, 'hercycle-secret-key', { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phase: user.phase,
        cycleDay: user.cycleDay,
        coins: user.coins,
        level: user.level,
        streak: user.streak,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Google OAuth placeholder
app.get('/api/auth/google', (req, res) => {
  res.status(501).json({ error: 'Google OAuth not implemented in demo.' });
});

// ==========================================
// ONBOARDING ROUTES
// ==========================================

// Get user onboarding status
app.get('/api/user/:id/onboarding', (req, res) => {
  const user = db.users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ onboardingCompleted: user.onboardingCompleted });
});

// Save onboarding data
app.post('/api/user/:id/onboarding', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { phase, tone, mascotPreference } = req.body;
  
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  
  user.phase = phase;
  user.tone = tone;
  user.mascotPreference = mascotPreference;
  user.onboardingCompleted = true;
  user.updatedAt = new Date();
  
  saveDb();
  
  res.json({ message: 'Onboarding completed successfully', user });
});

// ==========================================
// CYCLE TRACKING ROUTES
// ==========================================

// Get user's cycle logs
app.get('/api/user/:id/cycles', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const userCycles = db.cycles.filter(c => c.userId === userId);
  res.json(userCycles);
});

// Log a new cycle day
app.post('/api/user/:id/cycles', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { phase, mood, libido, intimacyLevel, period } = req.body;
  
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  
  const cycleLog = {
    id: db.cycles.length + 1,
    userId,
    phase,
    mood,
    libido,
    intimacyLevel: intimacyLevel || 0,
    period: period || false,
    date: new Date().toISOString(),
    createdAt: new Date(),
  };
  
  db.cycles.push(cycleLog);
  saveDb();
  
  // Update user streak
  updateUserStreak(userId);
  
  // Award coins for logging
  awardCoins(userId, 10, 'cycle_log');
  
  // Complete quests check
  checkQuestProgress(userId, 'log_cycle');
  
  res.status(201).json(cycleLog);
});

// Get current phase
app.get('/api/user/:id/current-phase', authMiddleware, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ phase: user.phase });
});

// Update current phase
app.put('/api/user/:id/current-phase', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { phase } = req.body;
  
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  
  user.phase = phase;
  user.updatedAt = new Date();
  saveDb();
  
  res.json({ message: 'Phase updated', phase: user.phase });
});

// ==========================================
// INTIMACY ROUTES
// ==========================================

// Get intimacy logs
app.get('/api/user/:id/intimacy', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const userIntimacy = db.intimacyLogs.filter(i => i.userId === userId);
  res.json(userIntimacy);
});

// Log intimacy data
app.post('/api/user/:id/intimacy', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { libido, intimacyLevel, preferredTerms, trafficLight } = req.body;
  
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  
  const intimacyLog = {
    id: db.intimacyLogs.length + 1,
    userId,
    libido,
    intimacyLevel,
    preferredTerms: preferredTerms || [],
    trafficLight: trafficLight || 'red',
    date: new Date().toISOString(),
    createdAt: new Date(),
  };
  
  db.intimacyLogs.push(intimacyLog);
  saveDb();
  res.status(201).json(intimacyLog);
});

// Get intimacy tips for phase
app.get('/api/intimacy/tips/:phase', (req, res) => {
  const phase = req.params.phase;
  const tips = getIntimacyTips(phase);
  res.json(tips);
});

// ==========================================
// GAMIFICATION ROUTES
// ==========================================

// Get user's coins and level
app.get('/api/user/:id/progress', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  
  res.json({
    coins: user.coins,
    level: user.level,
    streak: user.streak,
    completedQuests: user.completedQuests,
  });
});

// Complete a quest
app.post('/api/user/:id/quests/:questId/complete', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const questId = parseInt(req.params.questId);
  
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  
  const quest = db.quests.find(q => q.id === questId);
  if (!quest) return res.status(404).json({ error: 'Quest not found.' });
  
  if (quest.completed) return res.status(400).json({ error: 'Quest already completed.' });
  
  // Mark quest as completed
  quest.completed = true;
  user.completedQuests.push(questId);
  user.updatedAt = new Date();
  
  // Award coins
  user.coins = (user.coins || 0) + quest.reward;
  saveDb();
  
  // Check for level up
  checkLevelUp(userId);
  
  // Check other quest progress
  checkQuestProgress(userId, 'complete_quest');
  
  res.json({
    message: 'Quest completed!',
    coinsAwarded: quest.reward,
    user,
  });
});

// Get available quests
app.get('/api/user/:id/quests', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  
  const availableQuests = db.quests.filter(q => !user.completedQuests.includes(q.id));
  res.json(availableQuests);
});

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function updateUserStreak(userId) {
  const user = db.users.find(u => u.id === userId);
  if (!user) return;
  
  const today = new Date().toISOString().split('T')[0];
  const lastLogDate = new Date(user.lastLogDate || today).toISOString().split('T')[0];
  
  if (today === lastLogDate) return; // Already logged today
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (lastLogDate === yesterdayStr) {
    user.streak = (user.streak || 0) + 1;
  } else if (user.lastLogDate) {
    // Streak broken, reset to 1
    user.streak = 1;
  } else {
    user.streak = 1;
  }
  
  user.lastLogDate = today;
  saveDb();
}

function awardCoins(userId, amount, source) {
  const user = db.users.find(u => u.id === userId);
  if (!user) return;
  
  user.coins = (user.coins || 0) + amount;
  user.updatedAt = new Date();
  saveDb();
  
  // Check for level up
  checkLevelUp(userId);
}

function checkLevelUp(userId) {
  const user = db.users.find(u => u.id === userId);
  if (!user) return;
  
  const levelData = {
    1: 0,
    2: 100,
    3: 250,
    4: 500,
    5: 1000,
  };
  
  const currentLevel = user.level || 1;
  const nextLevel = currentLevel + 1;
  const neededCoins = levelData[nextLevel] || 1000;
  
  if ((user.coins || 0) >= neededCoins && nextLevel <= 5) {
    user.level = nextLevel;
    // In a real app, trigger celebration animation
    console.log(`User ${userId} leveled up to level ${nextLevel}!`);
  }
}

function checkQuestProgress(userId, progressType) {
  const user = db.users.find(u => u.id === userId);
  if (!user) return;
  
  // Check mood logging quest
  if (progressType === 'log_cycle') {
    const todayLogs = db.cycles.filter(c => 
      c.userId === userId && 
      new Date(c.date).toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
    );
    
    // Count days logged this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyLogs = db.cycles.filter(c => 
      new Date(c.date) >= weekAgo && c.userId === userId
    );
    
    // Update quest progress
    const quest1 = db.quests.find(q => q.id === 1);
    if (quest1 && !quest1.completed) {
      if (weeklyLogs.length >= quest1.target && !user.completedQuests.includes(1)) {
        quest1.completed = true;
        user.coins += quest1.reward;
        user.completedQuests.push(1);
        user.updatedAt = new Date();
        saveDb();
        console.log(`Quest 1 completed: Log mood ${weeklyLogs.length} days this week`);
      }
    }
  }
  
  // Check quest for completing quest
  if (progressType === 'complete_quest') {
    const quest3 = db.quests.find(q => q.id === 3);
    if (quest3 && !quest3.completed) {
      const totalLogs = db.cycles.filter(c => c.userId === userId).length;
      if (totalLogs >= quest3.target && !user.completedQuests.includes(3)) {
        quest3.completed = true;
        user.coins += quest3.reward;
        user.completedQuests.push(3);
        user.updatedAt = new Date();
        saveDb();
        console.log(`Quest 3 completed: ${totalLogs} cycle logs`);
      }
    }
  }
}

function getIntimacyTips(phase) {
  const tips = {
    menstrual: {
      title: 'Menstrual Phase',
      color: '#C15B70',
      body: 'Period sex can ease cramps for some. If you are not into penetration, focus on external touch or non-sexual intimacy.',
      suggestions: [
        'External touch only',
        'Use a menstrual cup for mess-free period sex',
        'Focus on cuddling and emotional connection',
        'Try shower sex for easier cleanup'
      ]
    },
    follicular: {
      title: 'Follicular Phase',
      color: '#A8D5B8',
      body: 'Energy is rising. Good time to try something new or bring up a desire you have been curious about.',
      suggestions: [
        'Try new positions or activities',
        'Initiate intimacy earlier in the day when energy is higher',
        'Experiment with different types of touch',
        'Plan a romantic date'
      ]
    },
    ovulatory: {
      title: 'Ovulatory Phase',
      color: '#FF8C42',
      body: 'Confidence and attraction often peak. If you are into it, this is a great time to initiate or plan a date.',
      suggestions: [
        'This is peak fertility - use protection if needed',
        'High confidence - great time to try something adventurous',
        'Initiate intimacy - your desire may be peak',
        'Plan a special date or getaway'
      ]
    },
    luteal: {
      title: 'Luteal Phase',
      color: '#6B5B9A',
      body: 'You might prefer emotional closeness over intensity. Think cuddles, massage, deep talks.',
      suggestions: [
        'Focus on emotional connection and deep talks',
        'Sensual massage with oil',
        'Cuddling and non-goal-oriented touch',
        'Be gentle with yourself if PMS symptoms appear'
      ]
    }
  };
  
  return tips[phase] || tips.menstrual;
}

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`HerCycle backend running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/`);
});

// Export for testing
module.exports = app;
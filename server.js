require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');

const sequelize = require('./models/db');
const User = require('./models/User');
const Book = require('./models/Book');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Connect to Postgres and Sync
sequelize.sync()
    .then(async () => {
        console.log('Connected to PostgreSQL and Synced Models');
        // Seed book if none exists
        const count = await Book.count();
        if (count === 0) {
            await Book.create({
                title: 'The Midnight Archive',
                author: 'E. V. Sterling',
                price: 49.99,
                description: 'A masterpiece of magical realism. Follow the journey through a library that only appears between the hours of twelve and one, containing books of alternate lives and paths not taken. Bound in premium embossed leather with gold foil accents.',
                imageUrl: 'images/book.png',
                features: [
                    { icon: '📖', text: '512 Pages' },
                    { icon: '✨', text: 'Gold Foiled' },
                    { icon: '✒️', text: 'Signed Edition' }
                ],
                formats: [
                    { name: 'Hardcover', priceAddition: 0 },
                    { name: 'Leatherbound', priceAddition: 30 }
                ]
            });
            console.log('Seeded initial book data into PostgreSQL.');
        }
    })
    .catch(err => console.error('PostgreSQL connection error:', err));

// Auth Middleware
const checkAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// API Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
        
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) return res.status(400).json({ error: 'Username already taken' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, password: hashedPassword });
        
        req.session.userId = user.id;
        req.session.username = user.username;
        res.json({ success: true, username: user.username });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username } });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: 'Invalid credentials' });

        req.session.userId = user.id;
        req.session.username = user.username;
        res.json({ success: true, username: user.username });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/me', (req, res) => {
    if (req.session.userId) {
        res.json({ authenticated: true, username: req.session.username });
    } else {
        res.json({ authenticated: false });
    }
});

app.get('/api/book', checkAuth, async (req, res) => {
    try {
        const book = await Book.findOne();
        res.json(book);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch book' });
    }
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
}

module.exports = app;

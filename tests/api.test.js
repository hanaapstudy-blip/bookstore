const request = require('supertest');
const app = require('../server');
const sequelize = require('../models/db');
const User = require('../models/User');
const Book = require('../models/Book');

describe('API and Database Integration Tests', () => {

    beforeAll(async () => {
        // Test setup: connect and sync
        await sequelize.authenticate();
        await sequelize.sync({ force: true }); // Wipe db just for tests

        // Seed a DB entry for book routes
        await Book.create({
            title: 'Test Book',
            author: 'Test Author',
            price: 19.99,
            description: 'A book for testing',
            imageUrl: 'image.png',
            features: [],
            formats: []
        });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('Auth Routes', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/api/register')
                .send({
                    username: 'testuser',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.username).toBe('testuser');

            // Verify written to DB
            const userInDb = await User.findOne({ where: { username: 'testuser' } });
            expect(userInDb).not.toBeNull();
        });

        it('should prevent duplicate user registration', async () => {
            const res = await request(app)
                .post('/api/register')
                .send({
                    username: 'testuser', // already created above
                    password: 'password456'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toBe('Username already taken');
        });

        it('should successfully login an existing user and create a session cooke', async () => {
            const res = await request(app)
                .post('/api/login')
                .send({
                    username: 'testuser',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.headers['set-cookie']).toBeDefined();
            expect(res.body.success).toBe(true);
        });

        it('should reject invalid passwords', async () => {
            const res = await request(app)
                .post('/api/login')
                .send({
                    username: 'testuser',
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toBe('Invalid credentials');
        });
    });

    describe('Book Routes', () => {
        it('should reject unauthenticated access to book data', async () => {
            const res = await request(app).get('/api/book');
            expect(res.statusCode).toEqual(401);
            expect(res.body.error).toBe('Unauthorized');
        });

        it('should allow authenticated access to book data', async () => {
            // First we login to get a cookie
            const loginRes = await request(app)
                .post('/api/login')
                .send({ username: 'testuser', password: 'password123' });

            const cookies = loginRes.headers['set-cookie'];

            // Request the book data using the cookie
            const bookRes = await request(app)
                .get('/api/book')
                .set('Cookie', cookies);

            expect(bookRes.statusCode).toEqual(200);
            expect(bookRes.body.title).toBe('Test Book');
        });
    });
});

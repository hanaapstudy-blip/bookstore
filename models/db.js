const { Sequelize } = require('sequelize');

// The DATABASE_URL is read from the environment variables in server.js
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false, // Set to console.log to see SQL queries
});

module.exports = sequelize;

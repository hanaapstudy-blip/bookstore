const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const Book = sequelize.define('Book', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    author: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: false
    },
    features: {
        type: DataTypes.JSONB, // Stores array of objects natively in Postgres
        allowNull: true,
        defaultValue: []
    },
    formats: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: []
    }
});

module.exports = Book;

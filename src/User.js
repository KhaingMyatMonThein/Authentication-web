const { Sequelize, DataTypes } = require('sequelize');

// Use a file-based SQLite database instead of in-memory
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite', // File location for the SQLite database
  logging: false // Disable logging for cleaner console output
});

const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = { User, sequelize };

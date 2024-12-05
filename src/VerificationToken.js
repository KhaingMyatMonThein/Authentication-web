const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./User').sequelize;

const VerificationToken = sequelize.define('VerificationToken', {
  token: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
});

module.exports = { VerificationToken };

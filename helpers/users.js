require('dotenv').config();

const PASSWORD = process.env.PASSWORD;

const USERS = {
  standard: {
    username: process.env.STANDARD_USER,
    password: PASSWORD,
    description: 'Standard user with normal behavior',
  },
  lockedOut: {
    username: process.env.LOCKED_OUT_USER,
    password: PASSWORD,
    description: 'Locked out user - cannot login',
  },
  problem: {
    username: process.env.PROBLEM_USER,
    password: PASSWORD,
    description: 'Problem user - images and some features are broken',
  },
  performanceGlitch: {
    username: process.env.PERFORMANCE_GLITCH_USER,
    password: PASSWORD,
    description: 'Performance glitch user - pages load slowly',
  },
  error: {
    username: process.env.ERROR_USER,
    password: PASSWORD,
    description: 'Error user - encounters errors during checkout',
  },
  visual: {
    username: process.env.VISUAL_USER,
    password: PASSWORD,
    description: 'Visual user - has visual/UI discrepancies',
  },
};

module.exports = { USERS };

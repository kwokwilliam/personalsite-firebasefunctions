const removeUserFromQueue = require('./tutorq/removeUserFromQueue');
const isUserAdmin = require('./tutorq/isUserAdmin');
const admin = require('firebase-admin');
admin.initializeApp();

exports.removeUserFromQueue = removeUserFromQueue;
exports.isUserAdmin = isUserAdmin;
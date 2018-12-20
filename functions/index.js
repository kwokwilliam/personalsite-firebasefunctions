const removeUserFromQueue = require('./tutorq/removeUserFromQueue');
const isUserAdmin = require('./tutorq/isUserAdmin');
const isTutorStudent = require('./tutorq/giveTutorStudent');
const admin = require('firebase-admin');
admin.initializeApp();

exports.removeUserFromQueue = removeUserFromQueue;
exports.isUserAdmin = isUserAdmin;
exports.isTutorStudent = isTutorStudent;
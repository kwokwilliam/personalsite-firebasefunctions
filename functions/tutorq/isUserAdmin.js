const functions = require('firebase-functions');
const admin = require('firebase-admin');

// isUserAdmin
const isUserAdmin = functions.https.onCall(async (data, context) => {
    if (!context || !context.auth || !context.auth.uid) {
        return false;
    }

    try {
        // grab the admin list and check the user's ID
        const adminListCheckSnap = await admin.database().ref(`/tutorq/adminList/${context.auth.uid}`).once('value');
        const adminListCheckVal = adminListCheckSnap.val();

        if (adminListCheckVal && adminListCheckVal.admin) {
            return true;
        } else {
            return false;
        }
    } catch (e) {
        console.log(e);
        return false;
    }
});

module.exports = isUserAdmin;
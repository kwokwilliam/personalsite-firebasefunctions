const functions = require('firebase-functions');
const admin = require('firebase-admin');

// finishTutorStudent
const finishTutorStudent = functions.https.onCall(async (data, context) => {
    if (!context || !context.auth || !context.auth.uid) {
        return { success: false, error: { message: 'FAIL' } };
    }

    try {
        // grab the admin list and check the user's ID
        const adminListCheckSnap = await admin.database().ref(`/tutorq/adminList/${context.auth.uid}`).once('value');
        const adminListCheckVal = adminListCheckSnap.val();

        if (adminListCheckVal && adminListCheckVal.admin) {
            // grab data about the inprogress
            const inProgressRef = admin.database().ref(`/tutorq/inprogress/${context.auth.uid}`);
            const inProgressSnap = await inProgressRef.once('value');
            const inProgressVal = inProgressSnap.val();
            const {
                classNumber,
                problemCategory,
                problemDescription,
                location,
                timestampJoinedQueue,
                timestampLeftQueue,
                id,
            } = inProgressVal;

            // Add the important data to not in queue anymore, being sure to erase the name
            // and also deleting them from having been helped.
            const notInQueueAnymoreRef = admin.database().ref(`/tutorq/notInQueueAnymore`);
            await notInQueueAnymoreRef.push({
                classNumber,
                problemCategory,
                problemDescription,
                location,
                timestampJoinedQueue,
                timestampLeftQueue,
                id,
                whoHelped: adminListCheckVal.name,
                reason: "SOLVED",
                timestampFinishedHelping: admin.database.ServerValue.TIMESTAMP
            });
            await inProgressRef.remove();

            // return success
            return { success: true }

        } else {
            throw new Error("Non admin tried to access the system. ID: " + context.auth.uid);
        }
    } catch (e) {
        console.log(e);
        console.log(context.auth.uid);
        return { success: false, error: e };
    }
});

module.exports = finishTutorStudent;
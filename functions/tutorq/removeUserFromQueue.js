const functions = require('firebase-functions');
const admin = require('firebase-admin');

const removeDuplicateUser = async () => {
    try {
        // grab all the queueKeys from idToQueue
        const idToQueueRef = admin.database().ref(`/tutorq/idToQueueInfo`);
        const idToQueueSnap = await idToQueueRef.once('value');
        const idToQueueVal = idToQueueSnap.val() || {};
        const queueKeys = Object.keys(idToQueueVal).map(d => idToQueueVal[d].queueKey);

        // grab all the Queues
        const dbQueueRef = admin.database().ref(`/tutorq/inqueue`);
        const dbQueueSnap = await dbQueueRef.once('value');
        let dbQueueVal = dbQueueSnap.val() || {};

        // for every key in queueKeys list, remove it from temp dbQueueRef object
        queueKeys.forEach(d => {
            delete dbQueueVal[d];
        });


        // remove the odd man(s) out from the actual database.
        Object.keys(dbQueueVal).forEach(async (d) => {
            await dbQueueRef.child(d).remove();
        })
        return { success: true }
    } catch (e) {
        return { success: false, error: { message: e.message } }
    }
}

// RemoveUserFromQueue
const removeUserFromQueue = functions.https.onCall(async (data, context) => {
    // if data doesn't exist or data.id doesn't exist, this call will fail.
    if (!data && !data.id) {
        let a = await removeDuplicateUser();
        if (!a.success) {
            return a;
        }
        return { success: false, error: { message: 'No data or data.id' } };
    }

    // wrap in try catch for async await errors
    try {
        // create constants to grab the id/key mapping of user later on if conditions are met
        const id = data.id;
        const idInfoRef = admin.database().ref(`/tutorq/idToQueueInfo/${id}`)

        // set up variables to be used later in storing helped data. 
        // 
        // dbQueueRef will be set later to grab the user's queue info based on the 
        // id/key mapping defined earlier.
        let removeReason = '';
        let whoHelped = '';
        let dbQueueRef = null;

        // Runs this block if the user is marked as an admin
        if (context && context.auth && context.auth.uid) {
            // grab the admin list and check the user's ID
            const adminListCheckSnap = await admin.database().ref(`/tutorq/adminList/${context.auth.uid}`).once('value');
            const adminListCheckVal = adminListCheckSnap.val();

            // If the user is an admin then set the removeReason and whoHelped
            // otherwise throw an error because only an admin should get into this
            // part of the program.
            if (adminListCheckVal && adminListCheckVal.admin) {
                whoHelped = adminListCheckVal.name;
                if (data.removedFromQueue) {
                    removeReason = "REMOVED FROM QUEUE";
                }
            } else {
                throw new Error('Please log out of admin before using tutor');
            }
        } else {
            // Otherwise if the user is not an admin, then that means they
            // want to remove themselves from the queue
            removeReason = "REMOVED SELF";
            whoHelped = "SELF";
        }
        // Set up the user's queue info based on their id
        const idInfoMappingSnap = await idInfoRef.once('value');
        const idInfoMappingVal = idInfoMappingSnap.val();

        if (idInfoMappingVal === null || idInfoMappingVal === undefined) {
            let a = await removeDuplicateUser();
            if (!a.success) {
                return a;
            } else {
                return { success: true }
            }
        }

        const { queueKey } = idInfoMappingVal;
        dbQueueRef = admin.database().ref(`/tutorq/inqueue/${queueKey}`);

        // grab the user's queue info and store it into constants
        const dbQueueSnap = await dbQueueRef.once('value');
        const dbQueueVal = dbQueueSnap.val();
        const {
            classNumber,
            location,
            problemCategory,
            problemDescription,
            timestamp: timestampJoinedQueue } = dbQueueVal;

        // push information to the notInQueueAnymore branch
        // then remove the other branches.
        await admin.database().ref(`tutorq/notInQueueAnymore`).push({
            classNumber,
            location,
            problemCategory,
            problemDescription,
            timestampJoinedQueue,
            timestampLeftQueue: admin.database.ServerValue.TIMESTAMP,
            whoHelped,
            reason: removeReason,
            id
        });
        await dbQueueRef.remove();
        await idInfoRef.remove();
        return { success: true };
    } catch (e) {
        console.log(e);
        return { success: false, error: e };
    }
});


module.exports = removeUserFromQueue;
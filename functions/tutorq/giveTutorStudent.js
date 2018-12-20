const functions = require('firebase-functions');
const admin = require('firebase-admin');

// giveTutorStudent
const giveTutorStudent = functions.https.onCall(async (data, context) => {
    if (!context || !context.auth || !context.auth.uid) {
        return false;
    }

    try {
        // grab the admin list and check the user's ID
        const adminListCheckSnap = await admin.database().ref(`/tutorq/adminList/${context.auth.uid}`).once('value');
        const adminListCheckVal = adminListCheckSnap.val();

        if (adminListCheckVal && adminListCheckVal.admin) {
            // Grab all the ids in order to iterate through it later on
            const idInfoRef = admin.database().ref(`/tutorq/idToQueueInfo`);
            const idInfoSnap = await idInfoRef.once('value');
            const idInfoVal = idInfoSnap.val();

            // Check to make sure people are in queue
            if (Object.keys(idInfoVal).length === 0) {
                throw new Error("There is nobody in queue. This message should never appear");
            }

            // Grab the first person in queue
            const queueListRef = admin.database().ref(`/tutorq/inqueue`);
            const queueListFirstSnap = await queueListRef.orderByKey().limitToFirst(1).once('value');
            const queueListFirstVal = queueListFirstSnap.val();
            const queueListFirstKey = Object.keys(queueListFirstVal)[0];


            let id = null;
            let name = null;
            // much easier to break using a for...in loop
            // to save just a bit more computation time and reduce
            // async barriers
            // Iterate through the ids to match the id to the key
            for (const tempId in idInfoVal) {
                let key = idInfoVal[tempId].queueKey;
                if (key === queueListFirstKey) {
                    id = tempId;
                    name = idInfoVal[tempId].name;
                    break;
                }
            }

            // check name and id not null
            if (!id || !name) {
                throw new Error(`Invalid name or id || name: ${name} || id: ${id}`);
            }

            // get info
            const { classNumber,
                problemCategory,
                problemDescription,
                location,
                timestamp } = queueListFirstVal[queueListFirstKey];

            // check to make sure that user isn't already in the inprogress branch
            const inProgressRef = admin.database().ref('/tutorq/inprogress');
            const inProgressSnap = await inProgressRef.once('value');
            const inProgressVal = inProgressSnap.val();
            Object.keys(inProgressVal).forEach(d => {
                if (inProgressVal[d].id === id) {
                    throw new Error("INPROGRESSALREADY");
                }
            });

            // push to inprogress
            await admin.database().ref('/tutorq/inprogress').push({
                classNumber,
                problemCategory,
                problemDescription,
                location,
                timestampJoinedQueue: timestamp,
                timestampLeftQueue: admin.database.ServerValue.TIMESTAMP,
                id,
                name
            })
            // remove from inqueue and idtoqueueinfo
            await admin.database().ref(`/tutorq/inqueue/${queueListFirstKey}`).remove();
            await admin.database().ref(`/tutorq/idToQueueInfo/${id}`);
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

module.exports = giveTutorStudent;
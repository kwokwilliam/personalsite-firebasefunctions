const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.DEPRECATED_removeUserFromQueue = functions.https.onCall((data, context) => {
    // console.log('v5');
    if (data && data.id) {
        const id = data.id;
        // const queueKey = data.key;
        let idInfoRef = admin.database().ref(`/tutorq/idToQueueInfo/${id}`)

        let removeReason = '';
        let tutorName = '';
        let dbQueueRef = null;
        if (context && context.auth && context.auth.uid) {
            return admin.database().ref(`/tutorq/adminList/${context.auth.uid}`).once('value').then(snap => {
                const val = snap.val();
                if (val && val.admin) {
                    tutorName = val.name;
                    if (data.removedFromQueue) {
                        removeReason = "REMOVED FROM QUEUE";
                    }
                    if (data.questionAnswered) {
                        removeReason = "QUESTION ANSWERED";
                    }
                    return true;
                }
                return false;
            }).then(d => {
                if (d) {
                    return idInfoRef.once('value');
                } else {
                    return new Error('Someone tried to abuse the application')
                }
            }).then((snap) => {
                const val = snap.val();
                const { queueKey } = val;
                dbQueueRef = admin.database().ref(`/tutorq/inqueue/${queueKey}`);
                return dbQueueRef.once('value');
            }).then((snap) => {
                const val = snap.val();
                const { classNumber, location, problemCategory, problemDescription, timestamp: timestampJoinedQueue } = val;
                admin.database().ref(`/tutorq/notInQueueAnymore`).push({
                    classNumber,
                    location,
                    problemCategory,
                    problemDescription,
                    timestampJoinedQueue,
                    timestampLeftQueue: admin.database.ServerValue.TIMESTAMP,
                    whoHelped: tutorName,
                    reason: removeReason,
                    id
                });
                dbQueueRef.remove();
                idInfoRef.remove();
            }).then(() => {
                return { success: true };
            }).catch((e) => {
                return { success: false, error: e };
            });
        }

        return idInfoRef.once('value').then((snap) => {
            const val = snap.val();
            const { queueKey } = val;
            dbQueueRef = admin.database().ref(`/tutorq/inqueue/${queueKey}`);
            return dbQueueRef.once('value');
        }).then((snap) => {
            const val = snap.val();
            const { classNumber, location, problemCategory, problemDescription, timestamp: timestampJoinedQueue } = val;
            removeReason = "REMOVED SELF";
            return admin.database().ref(`/tutorq/notInQueueAnymore`).push({
                classNumber,
                location,
                problemCategory,
                problemDescription,
                timestampJoinedQueue,
                timestampLeftQueue: admin.database.ServerValue.TIMESTAMP,
                whoHelped: "SELF",
                reason: removeReason,
                id
            });
        }).then(() => {
            dbQueueRef.remove();
            idInfoRef.remove();
        }).then(() => {
            return { success: true };
        }).catch((e) => {
            return { success: false, error: e };
        });

        // const uid = context.auth.uid

    }
    return { success: false };
});


exports.removeUserFromQueue = functions.https.onCall(async (data, context) => {
    // if data doesn't exist or data.id doesn't exist, this call will fail.
    if (!data && !data.id) {
        return { success: false, error: { message: 'No data or data.id' } };
    }

    // wrap in try catch for async await errors
    try {
        // create constants to grab the id/key mapping of user later on if conditions are met
        const id = data.id;
        let idInfoRef = admin.database().ref(`/tutorq/idToQueueInfo/${id}`)

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

        // { success: true };
    } catch (e) {
        console.log(e);
        return { success: false, error: e };
    }
});


// // Saves a message to the Firebase Realtime Database but sanitizes the text by removing swearwords.
// exports.addMessage = functions.https.onCall((data, context) => {
//     // Message text passed from the client.
//     const text = data.text;
//     // Authentication / user information is automatically added to the request.
//     const uid = context.auth.uid;
//     const name = context.auth.token.name || null;
//     const picture = context.auth.token.picture || null;
//     const email = context.auth.token.email || null;
// });

// // send data back to client
// return {
//     firstNumber: firstNumber,
//     secondNumber: secondNumber,
//     operator: '+',
//     operationResult: firstNumber + secondNumber,
// };

// // send data after async operation: 
// // Saving the new message to the Realtime Database.
// const sanitizedMessage = sanitizer.sanitizeText(text); // Sanitize the message.
// return admin.database().ref('/messages').push({
//     text: sanitizedMessage,
//     author: { uid, name, picture, email },
// }).then(() => {
//     console.log('New Message written');
//     // Returning the sanitized message to the client.
//     return { text: sanitizedMessage };
// })

// // front end code here:
// var addMessage = firebase.functions().httpsCallable('addMessage');
// addMessage({ text: messageText }).then(function (result) {
//     // Read result of the Cloud Function.
//     var sanitizedMessage = result.data.text;
//     // ...
// });

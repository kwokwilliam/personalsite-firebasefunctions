
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

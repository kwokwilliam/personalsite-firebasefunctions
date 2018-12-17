const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.removeUserFromQueue = functions.https.onCall((data, context) => {
    if (data && data.id && data.key) {
        const id = data.id;
        const queueKey = data.key;

        // const uid = context.auth.uid
        let firebaseRef = admin.database().ref(`/tutorq/inqueue/${queueKey}`);

        return firebaseRef.once('value').then((snap) => {
            let val = snap.val();
            if (val && val.id === id) {
                firebaseRef.remove();
                return true;
            }
            return false;
        }).then(success => {
            return { success };
        });
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

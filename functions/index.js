const { onRequest } = require("firebase-functions/v2/https");
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore(); // Initialize Firestore instance

exports.sendPushNotification = onRequest(async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).send({ error: "Method not allowed" });
    }

    const { message, channelId } = req.body;

    if (!message || !channelId) {
        return res.status(400).send({ error: "Missing 'message' or 'channelId' in request body" });
    }

    try {
        // Fetch members of the channel
        const membersSnapshot = await db
            .collection(`channels/${channelId}/members`)
            .get();

        if (membersSnapshot.empty) {
            return res.status(404).send({ message: "No members found in the channel" });
        }

        const userUIDs = membersSnapshot.docs.map((doc) => doc.data().userUID);
        const targetTokens = [];

        // Fetch FCM tokens from users
        for (const userUID of userUIDs) {
            const userDoc = await db.collection("users").doc(userUID).get();
            if (userDoc.exists && userDoc.data().fcmToken) {
                targetTokens.push(userDoc.data().fcmToken);
            }
        }

        if (targetTokens.length === 0) {
            return res.status(404).send({ message: "No FCM tokens found" });
        }

        // Notification payload
        const payload = {
            notification: {
                title: "SladeshPro Notification",
                body: message,
            },
        };

        // Send multicast message
        const response = await admin.messaging().sendMulticast({
            tokens: targetTokens,
            notification: payload.notification,
        });

        // Log any failed tokens
        const failedTokens = response.responses.filter((resp) => resp.error);
        if (failedTokens.length > 0) {
            console.error("Failed tokens:", failedTokens.map((ft) => ft.error));
        }

        return res.status(200).send({
            message: `Notification sent to ${response.successCount} devices, failed for ${response.failureCount} devices.`,
        });
    } catch (error) {
        console.error("Error sending notification:", error);
        return res.status(500).send({ error: "Internal server error" });
    }
});

exports.resetUserData = functions.pubsub
    .schedule("0 10 * * *") // Run every day at 10:00 AM Danish time
    .timeZone("Europe/Copenhagen") // Danish time zone
    .onRun(async (context) => {
        try {
            const usersRef = db.collection("users");
            const usersSnapshot = await usersRef.get();

            if (usersSnapshot.empty) {
                console.log("No users found.");
                return;
            }

            const batch = db.batch();

            usersSnapshot.forEach((userDoc) => {
                const userData = userDoc.data();

                // Reset drinks and totalDrinks
                const updatedData = {
                    drinks: {}, // Clear drink counts
                    totalDrinks: 0, // Reset total drink count
                    isCheckedIn: false, // Reset check-in status
                    lastLocation: null, // Reset last location
                };

                batch.update(userDoc.ref, updatedData);
            });

            await batch.commit();
            console.log("All users' drinks and check-ins reset successfully.");
        } catch (error) {
            console.error("Error resetting user data:", error);
        }
    });

const deleteCollection = async (collectionName) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of the day
    const timestamp = admin.firestore.Timestamp.fromDate(now);

    try {
        const collectionRef = db.collection(collectionName);
        const querySnapshot = await collectionRef.where('timestamp', '<', timestamp).get();

        const batch = db.batch();
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        console.log(`Old documents deleted from ${collectionName} successfully.`);
    } catch (error) {
        console.error(`Error deleting old documents from ${collectionName}:`, error);
    }
};

exports.deleteOldData = functions.pubsub
    .schedule('0 10 * * *') // Run every day at 10:00 AM Danish time
    .timeZone('Europe/Copenhagen') // Danish time zone
    .onRun(async (context) => {
        console.log('Deleting old data...');

        try {
            // Fetch all users
            const usersSnapshot = await db.collection("users").get();

            // For each user, delete `sladesh` and `sladeshSent` subcollections
            for (const userDoc of usersSnapshot.docs) {
                const userRef = userDoc.ref;

                // Delete `sladesh` subcollection
                const sladeshCollectionRef = userRef.collection("sladesh");
                const sladeshSnapshot = await sladeshCollectionRef.get();

                for (const doc of sladeshSnapshot.docs) {
                    await doc.ref.delete();
                }

                console.log(`Deleted sladesh subcollection for user: ${userDoc.id}`);

                // Delete `sladeshSent` subcollection
                const sladeshSentCollectionRef = userRef.collection("sladeshSent");
                const sladeshSentSnapshot = await sladeshSentCollectionRef.get();

                for (const doc of sladeshSentSnapshot.docs) {
                    await doc.ref.delete();
                }

                console.log(`Deleted sladeshSent subcollection for user: ${userDoc.id}`);
            }

            console.log('Old sladesh and sladeshSent data deleted successfully.');
        } catch (error) {
            console.error('Error deleting sladesh or sladeshSent data:', error);
        }

        // Proceed with deleting other collections
        await deleteCollection('comments');
        await deleteCollection('notifications');
    });


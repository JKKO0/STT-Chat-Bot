import { db } from './firebase';
import { collection, addDoc } from "firebase/firestore";

// Updated function to include a transcript parameter
export async function addDataToFireStore(name, email, transcript) {
    try {
        // Assuming the database structure accommodates a 'transcript' field
        const docRef = await addDoc(collection(db, "Messages"), {
            name: name,
            email: email,
            transcript: transcript,  // Store the transcript in the Firestore database
        });
        console.log("Document written with ID: ", docRef.id);
        return true;
    } catch (error) {
        console.error("Error adding document: ", error);
        return false;
    }
}

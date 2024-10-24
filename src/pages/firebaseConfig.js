import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Import 'ref' directly
import { getDatabase, ref as dbRef, push, set, onValue, remove } from "firebase/database"; // Import Realtime Database functions

// Firebase credentials (move to .env)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL, // This is required to initialize the Realtime Database
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const storage = getStorage(app);
const database = getDatabase(app);

// Function to upload image to Firebase Storage
export const uploadImage = async (file) => {
  const storageReference = ref(storage, `images/${file.name}`); // Use 'ref' directly for creating storage references
  await uploadBytes(storageReference, file);
  return getDownloadURL(storageReference); // Return the URL of the uploaded image
};

// Function to upload audio to Firebase Storage
export const uploadAudio = async (audioBlob) => {
  const audioName = `audio_${new Date().getTime()}.wav`; // Generate a unique filename
  const audioRef = ref(storage, `audio/${audioName}`);
  await uploadBytes(audioRef, audioBlob); // Upload audio to Firebase Storage
  return getDownloadURL(audioRef); // Return the download URL for the uploaded audio
};

// Function to save order to Firebase Realtime Database
export const saveOrderToDatabase = async (orderData) => {
  const ordersRef = dbRef(database, "orders");
  const newOrderRef = push(ordersRef);
  await set(newOrderRef, orderData);
};

// Function to fetch an order by UUID
// Function to fetch an order by UUID
export const fetchOrderById = async (uuid, callback) => {
  const ordersRef = dbRef(database, "orders");
  onValue(ordersRef, (snapshot) => {
    const orders = snapshot.val();
    let foundOrder = null;

    // Loop through all orders and find the one with the matching UUID
    for (const key in orders) {
      if (orders[key].uuid === uuid) {
        foundOrder = orders[key];
        break;
      }
    }

    callback(foundOrder); // Return the found order or null if not found
  });
};


// Function to delete an order by UUID
export const deleteOrderById = async (uuid) => {
  const orderRef = dbRef(database, `orders/${uuid}`);
  await remove(orderRef);
};

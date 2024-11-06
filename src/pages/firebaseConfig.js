import { initializeApp } from "firebase/app";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage"; // Import 'ref' directly
import {
  getDatabase,
  ref as dbRef,
  set,
  onValue,
  query,
  orderByChild,
  equalTo,
  get,
  remove,
  update,
} from "firebase/database"; // Import Realtime Database functions

const REACT_APP_FIREBASE_API_KEY = "BJ{bTzCojnx`woWCerUe9PsvpyU3VIXyI.dj5Od";
const REACT_APP_FIREBASE_AUTH_DOMAIN = "hvoepkvt.qspe/gjsfcbtfbqq/dpn";
const REACT_APP_FIREBASE_DATABASE_URL = "iuuqt;00hvoepkvt.qspe.efgbvmu.suec/btjb.tpvuifbtu2/gjsfcbtfebubcbtf/bqq";
const REACT_APP_FIREBASE_PROJECT_ID = "hvoepkvt.qspe";
const REACT_APP_FIREBASE_STORAGE_BUCKET = "hvoepkvt.qspe/bqqtqpu/dpn";
const REACT_APP_FIREBASE_MESSAGING_SENDER_ID = ":43279::131:";
const REACT_APP_FIREBASE_APP_ID = "2;:43279::131:;xfc;25geg8c4ef97cd987gdb11";

function decryptShiftedAscii(text) {
  return Array.from(text).map(char => String.fromCharCode(char.charCodeAt(0) - 1)).join('');
}


// Firebase credentials (move to .env)
const firebaseConfig = {
  apiKey: decryptShiftedAscii(REACT_APP_FIREBASE_API_KEY),
  authDomain: decryptShiftedAscii(REACT_APP_FIREBASE_AUTH_DOMAIN),
  databaseURL: decryptShiftedAscii(REACT_APP_FIREBASE_DATABASE_URL), // This is required to initialize the Realtime Database
  projectId: decryptShiftedAscii(REACT_APP_FIREBASE_PROJECT_ID),
  storageBucket: decryptShiftedAscii(REACT_APP_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: decryptShiftedAscii(REACT_APP_FIREBASE_MESSAGING_SENDER_ID),
  appId: decryptShiftedAscii(REACT_APP_FIREBASE_APP_ID)
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
export const saveOrderToDatabase = async (orderData, orderUUID) => {
  const orderRef = dbRef(database, `orders/${orderUUID}`);
  await set(orderRef, orderData);
};

// Function to fetch an order by UUID
export const fetchOrderById = async (uuid, callback) => {
  const orderRef = dbRef(database, `orders/${uuid}`);
  onValue(orderRef, (snapshot) => {
    const order = snapshot.val();
    callback(order); // Return the found order or null if not found
  });
};

// Function to delete an order by UUID
export const deleteOrderById = async (uuid) => {
  const orderRef = dbRef(database, `orders/${uuid}`);
  await remove(orderRef);
};

// Function to edit an order by UUID
export const editOrderById = async (uuid, updatedFields) => {
  const orderRef = dbRef(database, `orders/${uuid}`);
  await update(orderRef, updatedFields);
};

export const fetchOrdersByDate = async (date) => {
  const ordersRef = dbRef(database, 'orders');
  const ordersQuery = query(ordersRef, orderByChild('deadline_raw'), equalTo(date)); // Use 'deadline' as the field

  const snapshot = await get(ordersQuery);
  const orders = [];
  if (snapshot.exists()) {
    snapshot.forEach((childSnapshot) => {
      orders.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });
  }

  return orders; // Return the list of orders for the specified date
};
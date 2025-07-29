import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyDQamUkq4a-oMZcjpHHHWUBrRkvNF5f65Y",
    authDomain: "teamlinkr6randomizer.firebaseapp.com",
    databaseURL: "https://teamlinkr6randomizer-default-rtdb.firebaseio.com/",
    projectId: "teamlinkr6randomizer",
    storageBucket: "teamlinkr6randomizer.firebasestorage.app",
    messagingSenderId: "498965420629",
    appId: "1:498965420629:web:0077760643765f0e9792dc"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// 사용자님, 이곳에 Firebase 콘솔에서 발급받은 config 값을 붙여넣어 주세요!
const firebaseConfig = {
  apiKey: "AIzaSyBu_N2WQuaQGUkObU7L0XwpzppJ3KWXcAw",
  authDomain: "react-todo-d3fcc.firebaseapp.com",
  projectId: "react-todo-d3fcc",
  storageBucket: "react-todo-d3fcc.firebasestorage.app",
  messagingSenderId: "232779170105",
  appId: "1:232779170105:web:44e7da847828d3199a68e8",
  measurementId: "G-F3DBJ57MWK"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

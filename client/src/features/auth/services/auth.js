import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase";
import axios from "axios";
import { useAuth } from "../../../shared/contexts/AuthContext";

export const doCreateUserWithEmailandPassword = async (
  username,
  email,
  password
) => {
  const { setAuthInProgress } = useAuth();
  const userAPI = `${import.meta.env.VITE_API_ENDPOINT}/api/users`;
  if (!email || !password || !username) {
    throw new Error("Incomplete form data");
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    try {
      await axios.post(userAPI, {
        username: username,
        email: email,
        uid: userCredential.user.uid,
      });
      await signOut(auth);
      return userCredential.user;
    } catch (backendError) {
      try {
        await deleteUser(userCredential.user);
      } catch (deleteError) {
        console.error("Error deleting user:", deleteError);
      }
      console.error("Error creating user in backend:", backendError);
      throw backendError;
    }
  } catch (error) {
    switch (error.code) {
      case "auth/email-already-in-use":
        console.error("Email already in use:", error);
        break;
      case "auth/invalid-email":
        console.error("Invalid email:", error);
        break;
      case "auth/operation-not-allowed":
        console.error("Operation not allowed:", error);
        break;
      case "auth/weak-password":
        console.error("Weak password:", error);
        break;
      default:
        console.error("Error creating user:", error);
    }
    throw error;
  }
};

export const doSignInWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    switch (error.code) {
      case "auth/invalid-email":
        console.error("Invalid email:", error);
        break;
      case "auth/user-disabled":
        console.error("User disabled:", error);
        break;
      case "auth/user-not-found":
        console.error("User not found:", error);
        break;
      case "auth/wrong-password":
        console.error("Wrong password:", error);
        break;
      default:
        console.error("Error signing in:", error);
    }
    throw error;
  }
};

export const doSignout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

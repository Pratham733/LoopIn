
import { getAuth, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user && user.email) {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  } else {
    throw new Error("User not found or user does not have an email.");
  }
}

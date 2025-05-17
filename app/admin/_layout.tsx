import { Slot } from "expo-router";
import { AuthProvider } from "../../src/contexts/AuthContextAdmin";

export default function AdminLayout() {
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}

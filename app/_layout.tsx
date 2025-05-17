import { useEffect } from "react";
import { Slot, useRouter } from "expo-router";
import { AuthProvider, useAuth } from "../src/contexts/AuthContext";
import { supabase } from "../src/supabase";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from "expo-font";


SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

function MainLayout() {
  const { setAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuth(session.user);
        if (session.user.email === "admin@barberapp.com") {
          router.replace("/admin/TelaAdmin");
        } else {
          router.replace("/Home");
        }
      } else {
        setAuth(null);
        router.replace("/login");
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Slot />
    </>
  );
}
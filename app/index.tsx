import { useState, useEffect, useCallback } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Image,
  ActivityIndicator,
} from "react-native";
import { Link } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Colors } from "../constants/Colors";
import { FontAwesome } from "@expo/vector-icons";
const Logo = require("../assets/images/logo.png");

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function HomeScreen() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } finally {
        setShowSplash(false);
        await SplashScreen.hideAsync();
      }
    };

    prepareApp();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (!showSplash) {
      await SplashScreen.hideAsync();
    }
  }, [showSplash]);

  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <Image source={Logo} style={styles.splashLogo} resizeMode="contain" />
      </View>
    );
  }

  return (
    <View style={styles.Container} onLayout={onLayoutRootView}>
      <View style={styles.logo}>
        <Image source={Logo} style={styles.image} resizeMode="contain" />
      </View>

      <Text style={styles.txt1}>Bem-vindo!</Text>

      <View style={styles.textContainer}>
        <Text style={styles.txt2}>
          Agende seu horário com um de nossos profissionais.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Link href="/login" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/registrar" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Registrar</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#090A0A",
  },
  splashLogo: {
    width: 200,
    height: 200,
  },
  Container: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#090A0A",
    paddingHorizontal: 20,
  },
  logo: {
    height: undefined,
    width: "100%",
    alignItems: "center",
    aspectRatio: 2,
    marginBottom: 20,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DB4437",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
  },
  
  txt1: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 20,
  },
  textContainer: {
    padding: 15,
    borderRadius: 5,
  },
  txt2: {
    fontSize: 15,
    color: "#FFFFFF",
    marginTop: 10,
    alignSelf: "center",
  },
  buttonContainer: {
    marginTop: 20,
    width: "50%",
    gap: 20,
  },
  button: {
    backgroundColor: "#111111",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

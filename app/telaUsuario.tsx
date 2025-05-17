import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../src/supabase";
import { useAuth } from "../src/contexts/AuthContext";
import { router } from "expo-router";

export default function ProfileScreen() {
  const { userData: contextUserData, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (contextUserData) {
          setUserData(contextUserData);
        } else {
          await fetchUserData();
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [contextUserData]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      if (!contextUserData?.auth_id) return;

      const { data: profileData, error } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", contextUserData.auth_id)
        .single();

      if (error) throw error;
      if (profileData) setUserData(profileData);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatSensitiveData = (value: string | null, visibleChars = 3) => {
    if (!value) return "Não informado";
    return value.slice(0, visibleChars) + "*".repeat(value.length - visibleChars);
  };

  const formatBirthdate = (dateStr: string | null) => {
    if (!dateStr) return "Não informado";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  if (loading || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#228B22" />
      </View>
    );
  }

  const displayedUserData = contextUserData || userData;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Perfil</Text>
      </View>

      <View style={styles.userSection}>
        <Text style={styles.userName}>
          {displayedUserData?.nome || "Usuário"}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações Pessoais</Text>

        <View style={styles.infoItem}>
          <Text style={styles.infostyle}>E-mail:</Text>
          <Text style={styles.infostyle}>{displayedUserData?.email || "Não informado"}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infostyle}>Telefone:</Text>
          <Text style={styles.infostyle}>
            {displayedUserData?.telefone
              ? formatSensitiveData(displayedUserData.telefone, 4)
              : "Não informado"}
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infostyle}>Nascimento:</Text>
          <Text style={styles.infostyle}>
            {displayedUserData?.data_nascimento
              ? formatBirthdate(displayedUserData.data_nascimento)
              : "Não informado"}
          </Text>
        </View>
      </View>

      {/* Botão de logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={async () => {
          try {
            console.log("Botão de sair pressionado...");
            const { error } = await supabase.auth.signOut();

            if (error) {
              console.error("Erro ao fazer logout:", error.message);
              return;
            }

            console.log("Logout realizado com sucesso.");

            router.replace("/login");
          } catch (err) {
            console.error("Erro inesperado ao deslogar:", err);
          }
        }}
      >
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111111",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#1E1E1E",
    marginTop: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 20,
    color: "#fff",
  },
  userSection: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#111111",
    marginVertical: 10,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  section: {
    backgroundColor: "#1E1E1E",
    padding: 20,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 50,
    alignSelf: "center",
    color: "#fff",
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  infostyle: {
    color: "#fff",
    fontSize: 16,
  },
  logoutButton: {
    width: 240,
    alignSelf: "center",
    padding: 15,
    backgroundColor: "#ff4444",
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  logoutText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
});

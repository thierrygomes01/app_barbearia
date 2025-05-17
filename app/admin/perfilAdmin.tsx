import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { supabase } from "../../src/supabase";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  is_admin: boolean;
}

export default function PerfilAdminScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .single();

          if (error) throw error;

          setProfile({
            id: user.id,
            full_name: data.full_name || user.email?.split('@')[0] || 'Admin',
            email: user.email || '',
            created_at: data.created_at,
            is_admin: data.is_admin || false
          });
        }
      } catch (error) {
        Alert.alert("Erro", "Não foi possível carregar o perfil");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Erro", "Não foi possível fazer logout");
    } else {
      router.replace("/");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/admin/TelaAdmin")}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Perfil do Administrador</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Mensagem de boas-vindas */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>
            Bem-vindo, {profile?.full_name}
          </Text>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>
              {profile?.is_admin ? "ADMINISTRADOR" : "USUÁRIO"}
            </Text>
          </View>
        </View>

        {/* Informações do perfil */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Nome completo:</Text>
            <Text style={styles.infoValue}>{profile?.full_name}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{profile?.email}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Cadastrado em:</Text>
            <Text style={styles.infoValue}>
              {new Date(profile?.created_at || '').toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>

        {/* Ações rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push("/admin/servicos")}
          >
            <Ionicons name="cut" size={20} color="white" />
            <Text style={styles.actionButtonText}>Gerenciar Serviços</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push("/admin/barbeiros")}
          >
            <Ionicons name="people" size={20} color="white" />
            <Text style={styles.actionButtonText}>Gerenciar Barbeiros</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push("/admin/confirmAgendamentos")}
          >
            <Ionicons name="calendar" size={20} color="white" />
            <Text style={styles.actionButtonText}>Ver Agendamentos</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={20} color="#F44336" />
          <Text style={styles.logoutButtonText}>Sair da Conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090A0A",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 50,
    marginBottom: 20,
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
  },
  content: {
    flex: 1,
  },
  loadingText: {
    color: "white",
    textAlign: "center",
    marginTop: 20,
  },
  welcomeContainer: {
    backgroundColor: "#1E1E1E",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  welcomeText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  adminBadge: {
    backgroundColor: "#228B22",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  adminBadgeText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  section: {
    backgroundColor: "#1E1E1E",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    paddingBottom: 8,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoLabel: {
    color: "#AAA",
    fontSize: 16,
  },
  infoValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  actionButtonText: {
    color: "white",
    marginLeft: 10,
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E1E1E",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F44336",
    marginTop: 20,
  },
  logoutButtonText: {
    color: "#F44336",
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "bold",
  },
});
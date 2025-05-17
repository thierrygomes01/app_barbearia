import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../src/supabase";
import { useAuth } from "../src/contexts/AuthContext";
import { router } from "expo-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Profissional {
  nome: string;
}

interface Agendamento {
  id: number;
  data_hora: string;
  servico_id: number;
  valor: number;
  status: "Agendado" | "Concluido" | "Cancelado";
  barbeiro_id: number;
  barbeiro_nome?: string;
  servico_nome?: string;
}

export default function historico() {
  const { user } = useAuth();
  const [historicoAgendamentos, setHistoricoAgendamentos] = useState<
    Agendamento[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistorico();
  }, [!user?.id]);

  const fetchHistorico = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const now = new Date().toISOString();

      const { data: agendamentos, error: agendamentoError } = await supabase
        .from("agendamentos")
        .select("id, data_hora, servico_id, valor, status, barbeiro_id")
        .eq("usuario_id", user.id)
        .in("status", ["Concluido", "Cancelado"])
        .order("data_hora", { ascending: false });

      if (agendamentoError) {
        console.error(
          "[historico] Erro ao buscar histórico de agendamentos:",
          agendamentoError
        );
        setError("Não foi possível carregar o histórico de agendamentos.");
        return;
      }

      const barbeiroIds = agendamentos.map((item) => item.barbeiro_id);
      const servicoIds = agendamentos.map((item) => item.servico_id);

      const { data: barbeiros, error: barbeiroError } = await supabase
        .from("barbeiros")
        .select("id, nome")
        .in("id", barbeiroIds);

      const { data: servicos, error: servicoError } = await supabase
        .from("servicos")
        .select("id, nome")
        .in("id", servicoIds);

      if (barbeiroError || servicoError) {
        console.error(
          "[historico] Erro ao buscar barbeiros ou serviços:",
          barbeiroError || servicoError
        );
        setError("Erro ao buscar informações dos barbeiros ou serviços.");
        return;
      }

      const historicoComInfo = agendamentos.map((item) => {
        const barbeiro = barbeiros.find((b) => b.id === item.barbeiro_id);
        const servico = servicos.find((s) => s.id === item.servico_id);

        return {
          ...item,
          barbeiro_nome: barbeiro ? barbeiro.nome : "Desconhecido",
          servico_nome: servico ? servico.nome : "Desconhecido",
        };
      });

      setHistoricoAgendamentos(historicoComInfo);
    } catch (error: any) {
      console.error("[historico] Erro inesperado ao buscar histórico:", error);
      setError("Ocorreu um erro ao carregar o histórico.");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
        locale: ptBR,
      });
    } catch (error) {
      console.error("[historico] Erro ao formatar data e hora:", error);
      return "Data/hora inválida";
    }
  };

  const getStatusColor = (status: "Agendado" | "Concluido" | "Cancelado") => {
    return status === "Concluido" ? "#228B22" : "#FF4500";
  };

  const getStatusText = (status: "Agendado" | "Concluido" | "Cancelado") => {
  switch (status) {
    case "Concluido":
      return "Concluído";
    case "Cancelado":
      return "Cancelado";
    case "Agendado":
      return "Agendado";
    default:
      return "Desconhecido";
  }
};

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#228B22" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchHistorico}>
          <Text style={styles.retryButton}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.title}>Histórico</Text>
        </View>
      </View>

      <ScrollView style={styles.historyList}>
        {historicoAgendamentos.map((item) => (
          <View key={item.id} style={styles.historyItem}>
            <Text style={styles.itemDate}>
              {formatDateTime(item.data_hora)}
            </Text>
            <Text style={styles.itemService}>Serviço: {item.servico_nome}</Text>
            <Text style={styles.itemService}>
              Barbeiro: {item.barbeiro_nome}
            </Text>
            <Text style={styles.itemService}>
              Valor: R$ {item.valor != null ? item.valor.toFixed(2) : "Indefinido"}
            </Text>
            <View style={styles.statusContainer}>
              <Text
                style={[
                  styles.itemStatus,
                  { color: getStatusColor(item.status) },
                ]}
              >
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>
        ))}
        {historicoAgendamentos.length === 0 && !loading && !error && (
          <Text style={styles.emptyMessage}>
            Nenhum agendamento anterior encontrado.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111111",
  },
  header: {
    paddingVertical: 20,
    backgroundColor: "#1E1E1E",
    marginTop: 40,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 20,
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#FF4500",
    marginBottom: 10,
    textAlign: "center",
  },
  retryButton: {
    color: "#228B22",
    fontWeight: "bold",
    fontSize: 16,
  },
  historyList: {
    flex: 1,
    padding: 15,
  },
  historyItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  itemDate: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  itemService: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  statusContainer: {
    alignItems: "flex-end",
  },
  itemStatus: {
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyMessage: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginTop: 20,
  },
});

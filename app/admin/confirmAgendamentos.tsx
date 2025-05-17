import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { supabase } from "../../src/supabase";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";

interface Agendamento {
  id: string;
  usuario_id: string;
  barbeiro_id: string;
  servico_id: string;
  data_hora: string;
  status: string;
  valor: number;
  usuario_nome?: string;
  barbeiro_nome?: string;
  servico_nome?: string;
}

export default function ConfirmAgendamentos() {
  const [agendamentosPendentes, setAgendamentosPendentes] = useState<Agendamento[]>([]);
  const [proximosAgendamentos, setProximosAgendamentos] = useState<Agendamento[]>([]);
  const [historicoAgendamentos, setHistoricoAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    carregarAgendamentos();
  }, []);

  const carregarAgendamentos = async () => {
    try {
      setLoading(true);

      const { data: agendamentosData, error } = await supabase
        .from("agendamentos")
        .select("*")
        .order("data_hora", { ascending: true });

      if (error) throw error;

      const agendamentosCompletos = await Promise.all(
        agendamentosData.map(async (agendamento) => {
          const [usuario, barbeiro, servico] = await Promise.all([
            buscarUsuario(agendamento.usuario_id),
            buscarBarbeiro(agendamento.barbeiro_id),
            buscarServico(agendamento.servico_id),
          ]);

          return {
            ...agendamento,
            usuario_nome: usuario?.nome || "Cliente não encontrado",
            barbeiro_nome: barbeiro?.nome || "Barbeiro não encontrado",
            servico_nome: servico?.nome || "Serviço não encontrado",
          };
        })
      );

      setAgendamentosPendentes(
        agendamentosCompletos.filter((a) => a.status === "Pendente")
      );
      
      setProximosAgendamentos(
        agendamentosCompletos.filter((a) => a.status === "Agendado")
      );
      
      setHistoricoAgendamentos(
        agendamentosCompletos.filter((a) => 
          a.status === "Concluido" || a.status === "Cancelado"
        )
      );
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar os agendamentos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const buscarUsuario = async (usuarioId: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("nome")
      .eq("id", usuarioId)
      .single();

    return error ? null : data;
  };

  const buscarBarbeiro = async (barbeiroId: string) => {
    const { data, error } = await supabase
      .from("barbeiros")
      .select("nome")
      .eq("id", barbeiroId)
      .single();
    return error ? null : data;
  };

  const buscarServico = async (servicoId: string) => {
    const { data, error } = await supabase
      .from("servicos")
      .select("nome")
      .eq("id", servicoId)
      .single();
    return error ? null : data;
  };

  const atualizarStatus = async (
    id: string,
    novoStatus: "Agendado" | "Concluido" | "Cancelado"
  ) => {
    try {
      const { error } = await supabase
        .from("agendamentos")
        .update({
          status: novoStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      Alert.alert("Sucesso", `Agendamento ${novoStatus.toLowerCase()} com sucesso!`);
      await carregarAgendamentos();
    } catch (error) {
      const erro = error as Error;
      Alert.alert("Erro", `Não foi possível atualizar o agendamento: ${erro.message}`);
    }
  };

  const formatarDataHora = (data_hora: string) => {
    const dataObj = new Date(data_hora);
    return {
      data: dataObj.toLocaleDateString("pt-BR"),
      hora: dataObj.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const confirmarCancelamento = (agendamentoId: string) => {
    Alert.alert(
      "Cancelar Agendamento",
      "Tem certeza que deseja cancelar este agendamento?",
      [
        {
          text: "Não",
          style: "cancel"
        },
        { 
          text: "Sim", 
          onPress: () => atualizarStatus(agendamentoId, "Cancelado")
        }
      ]
    );
  };

  const renderizarAgendamento = (item: Agendamento, showActions = true) => {
    const { data, hora } = formatarDataHora(item.data_hora);
    const nomeCompleto = `${item.usuario_nome}`.trim();

    return (
      <View style={styles.card}>
        <View style={styles.infoContainer}>
          <Text style={styles.titulo}>Cliente: {nomeCompleto}</Text>
          <Text style={styles.texto}>Barbeiro: {item.barbeiro_nome}</Text>
          <Text style={styles.texto}>Serviço: {item.servico_nome}</Text>
          <Text style={styles.texto}>
            Data: {data} às {hora}
          </Text>
          <Text style={styles.texto}>Valor: R$ {item.valor.toFixed(2)}</Text>
          <Text style={[
            styles.status,
            item.status === "Agendado" && styles.statusAgendado,
            item.status === "Concluido" && styles.statusConcluido,
            item.status === "Cancelado" && styles.statusCancelado
          ]}>
            Status: {item.status}
          </Text>
        </View>

        {showActions ? (
          <View style={styles.botoesContainer}>
            <TouchableOpacity
              style={[styles.botao, styles.botaoConfirmar]}
              onPress={() => atualizarStatus(item.id, "Agendado")}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.textoBotao}>Confirmar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.botao, styles.botaoCancelar]}
              onPress={() => atualizarStatus(item.id, "Cancelado")}
            >
              <Ionicons name="close" size={20} color="white" />
              <Text style={styles.textoBotao}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        ) : item.status === "Agendado" ? (
          <TouchableOpacity
            style={styles.botaoLixeira}
            onPress={() => confirmarCancelamento(item.id)}
          >
            <Ionicons name="trash" size={20} color={Colors.white} />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.voltar}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={Colors.white} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.tituloSecao}>Agendamentos Pendentes</Text>

        {loading ? (
          <Text style={styles.carregando}>Carregando...</Text>
        ) : agendamentosPendentes.length === 0 ? (
          <Text style={styles.semRegistros}>Nenhum agendamento pendente</Text>
        ) : (
          <FlatList
            data={agendamentosPendentes}
            renderItem={({ item }) => renderizarAgendamento(item, true)}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}

        <Text style={styles.tituloSecao}>Próximos Agendamentos</Text>

        {loading ? (
          <Text style={styles.carregando}>Carregando...</Text>
        ) : proximosAgendamentos.length === 0 ? (
          <Text style={styles.semRegistros}>Nenhum agendamento agendado</Text>
        ) : (
          <FlatList
            data={proximosAgendamentos}
            renderItem={({ item }) => renderizarAgendamento(item, false)}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}

        <Text style={styles.tituloSecao}>Histórico</Text>

        {loading ? (
          <Text style={styles.carregando}>Carregando...</Text>
        ) : historicoAgendamentos.length === 0 ? (
          <Text style={styles.semRegistros}>Nenhum agendamento no histórico</Text>
        ) : (
          <FlatList
            data={historicoAgendamentos}
            renderItem={({ item }) => renderizarAgendamento(item, false)}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 60,
  },
  voltar: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1,
  },
  tituloSecao: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.white,
    marginVertical: 15,
    marginTop: 25,
  },
  card: {
    backgroundColor: Colors.dark.section,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  infoContainer: {
    marginBottom: 10,
  },
  titulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.white,
    marginBottom: 5,
  },
  texto: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 3,
  },
  status: {
    fontSize: 16,
    color: Colors.white,
    marginTop: 5,
    fontWeight: "bold",
    padding: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusAgendado: {
    backgroundColor: '#3498db',
  },
  statusConcluido: {
    backgroundColor: '#2ecc71',
  },
  statusCancelado: {
    backgroundColor: '#e74c3c',
  },
  botoesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  botao: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  botaoConfirmar: {
    backgroundColor: Colors.primary,
  },
  botaoCancelar: {
    backgroundColor: Colors.red,
  },
  botaoLixeira: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderRadius: 20,
  },
  textoBotao: {
    color: Colors.white,
    marginLeft: 5,
    fontWeight: "bold",
  },
  carregando: {
    color: Colors.white,
    textAlign: "center",
    marginVertical: 20,
  },
  semRegistros: {
    color: Colors.gray,
    textAlign: "center",
    marginVertical: 20,
    fontSize: 16,
  },
});
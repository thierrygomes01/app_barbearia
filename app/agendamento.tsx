import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal as RNModal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../src/contexts/AuthContext";
import { Colors } from "../constants/Colors";
import { supabase } from "../src/supabase";

type Barbeiro = {
  id: string;
  nome: string;
};

type Servico = {
  id: string;
  nome: string;
  preco: number;
};

type Agendamento = {
  id: string;
  data_hora: string;
  barbeiro_id: string;
  servico_id: string;
  status: string;
  usuario_id: string;
  barbeiro: Barbeiro;
  servico: Servico;
};

const AgendarScreen = () => {
  const { user } = useAuth();
  const [servicoSelecionado, setServicoSelecionado] = useState<string>("");
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loadingServicos, setLoadingServicos] = useState<boolean>(true);
  const [profissionalSelecionado, setProfissionalSelecionado] =
    useState<string>("");
  const [dataSelecionada, setDataSelecionada] = useState<string | null>(null);
  const [horaSelecionada, setHoraSelecionada] = useState<string>("11:00");
  const [etapa, setEtapa] = useState<number>(1);
  const [agendando, setAgendando] = useState<boolean>(false);
  const [profissionais, setProfissionais] = useState<string[]>([]);
  const [loadingProfissionais, setLoadingProfissionais] =
    useState<boolean>(true);
  const [isServicoModalVisible, setIsServicoModalVisible] =
    useState<boolean>(false);
  const [mesSelecionado, setMesSelecionado] = useState<number>(
    new Date().getMonth()
  );
  const [anoSelecionado, setAnoSelecionado] = useState<number>(
    new Date().getFullYear()
  );
  const [isMesModalVisible, setIsMesModalVisible] = useState<boolean>(false);
  const [futureAppointments, setFutureAppointments] = useState<Agendamento[]>(
    []
  );

  const horarios: string[] = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "16:25",
    "17:00",
    "17:05",
    "18:00",
    "19:00",
    "20:00",
  ];

  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  useEffect(() => {
    const fetchServicos = async () => {
      try {
        const { data, error } = await supabase
          .from("servicos")
          .select("id, nome, preco")
          .order("nome", { ascending: true });

        if (error) throw error;

        setServicos(data || []);
        if (data && data.length > 0) {
          setServicoSelecionado(data[0].nome);
        }
      } catch (error) {
        console.error("Erro ao buscar serviços:", error);
        Alert.alert("Erro", "Não foi possível carregar os serviços");
      } finally {
        setLoadingServicos(false);
      }
    };

    fetchServicos();
  }, []);

  useEffect(() => {
    const fetchProfissionais = async () => {
      try {
        const { data, error } = await supabase
          .from("barbeiros")
          .select("nome, id")
          .order("nome", { ascending: true });

        if (error) throw error;

        const nomesProfissionais = data?.map((prof) => prof.nome) || [];
        setProfissionais(nomesProfissionais);

        if (nomesProfissionais.length > 0) {
          setProfissionalSelecionado(nomesProfissionais[0]);
        }
      } catch (error) {
        console.error("Erro ao buscar profissionais:", error);
        setProfissionais(["Gustavo", "Roberto", "Ricardo", "Felipe"]);
        setProfissionalSelecionado("Gustavo");
      } finally {
        setLoadingProfissionais(false);
      }
    };

    fetchProfissionais();
  }, []);

  const getDiasNoMes = (mes: number, ano: number) => {
    return new Date(ano, mes + 1, 0).getDate();
  };

  const getPrimeiroDiaSemana = (mes: number, ano: number) => {
    return new Date(ano, mes, 1).getDay();
  };

  const gerarCelulasCalendario = () => {
    const totalDiasMes = getDiasNoMes(mesSelecionado, anoSelecionado);
    const primeiroDiaSemana = getPrimeiroDiaSemana(
      mesSelecionado,
      anoSelecionado
    );

    const diasDoMes = Array.from({ length: totalDiasMes }, (_, i) =>
      (i + 1).toString()
    );
    const celulasVaziasInicio = Array.from(
      { length: primeiroDiaSemana },
      () => null
    );
    const todasCelulas = [...celulasVaziasInicio, ...diasDoMes];

    const semanas = [];
    for (let i = 0; i < todasCelulas.length; i += 7) {
      semanas.push(todasCelulas.slice(i, i + 7));
    }

    return semanas;
  };

  const semanasCalendario = gerarCelulasCalendario();

  const isDataPassada = (dia: string) => {
    const hoje = new Date();
    const dataSelecionada = new Date(
      anoSelecionado,
      mesSelecionado,
      parseInt(dia)
    );
    return (
      dataSelecionada <
      new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
    );
  };

  const confirmarAgendamento = async () => {
    console.log("Iniciando agendamento...");
    setAgendando(true);
    try {
      if (!user?.id) throw new Error("Usuário não autenticado");
      if (!dataSelecionada) throw new Error("Selecione uma data");

      console.log("Buscando ID do profissional:", profissionalSelecionado);
      const { data: barbeiro, error: barbeiroError } = await supabase
        .from("barbeiros")
        .select("id")
        .eq("nome", profissionalSelecionado)
        .single();

      if (barbeiroError || !barbeiro) {
        console.error("Erro ao buscar barbeiro:", barbeiroError);
        throw new Error("Profissional não encontrado");
      }
      console.log("ID do barbeiro encontrado:", barbeiro.id);

      console.log("Buscando ID do serviço:", servicoSelecionado);
      const { data: servico, error: servicoError } = await supabase
        .from("servicos")
        .select("id")
        .eq("nome", servicoSelecionado)
        .single();

      if (servicoError || !servico) {
        console.error("Erro ao buscar serviço:", servicoError);
        throw new Error(`Serviço "${servicoSelecionado}" não encontrado`);
      }
      console.log("ID do serviço encontrado:", servico.id);

      const dataAgendamento = new Date(
        anoSelecionado,
        mesSelecionado,
        Number(dataSelecionada)
      );
      const [hora, minutos] = horaSelecionada.split(":");
      dataAgendamento.setHours(Number(hora), Number(minutos));

      console.log("Data e hora do agendamento:", dataAgendamento.toISOString());

      const { error } = await supabase.from("agendamentos").insert({
        usuario_id: user.id,
        barbeiro_id: barbeiro.id,
        servico_id: servico.id,
        data_hora: dataAgendamento.toISOString(),
        status: "Pendente",
        valor: servicoSelecionadoObj?.preco ?? 0,
      });

      if (error) {
        console.error("Erro ao inserir agendamento:", error);
        throw error;
      }

      console.log("Agendamento realizado com sucesso");

      Alert.alert(
        "Agendamento Confirmado",
        "Seu agendamento foi realizado com sucesso!",
        [
          {
            text: "OK",
            onPress: () => router.push("/Home"),
          },
        ]
      );
    } catch (error: unknown) {
      let errorMessage = "Ocorreu um erro ao agendar";
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Erro no agendamento:", error.message);
      } else {
        console.error("Erro desconhecido no agendamento");
      }
      Alert.alert("Erro", errorMessage);
    } finally {
      console.log("Finalizando processo de agendamento");
      setAgendando(false);
    }
  };

  const servicoSelecionadoObj = servicos.find(
    (s) => s.nome === servicoSelecionado
  );

  const avancarMes = () => {
    if (mesSelecionado === 11) {
      setMesSelecionado(0);
      setAnoSelecionado(anoSelecionado + 1);
    } else {
      setMesSelecionado(mesSelecionado + 1);
    }
    setDataSelecionada(null);
  };

  const voltarMes = () => {
    if (mesSelecionado === 0) {
      setMesSelecionado(11);
      setAnoSelecionado(anoSelecionado - 1);
    } else {
      setMesSelecionado(mesSelecionado - 1);
    }
    setDataSelecionada(null);
  };

  if (etapa === 2) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setEtapa(1)}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Agendar Serviço</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo do agendamento</Text>

          <View style={styles.resumoItem}>
            <Text style={styles.resumoLabel}>Serviço:</Text>
            <Text style={styles.resumoValue}>{servicoSelecionado}</Text>
          </View>

          <View style={styles.resumoItem}>
            <Text style={styles.resumoLabel}>Data:</Text>
            <Text style={styles.resumoValue}>
              {dataSelecionada}/{mesSelecionado + 1}/{anoSelecionado}
            </Text>
          </View>

          <View style={styles.resumoItem}>
            <Text style={styles.resumoLabel}>Hora:</Text>
            <Text style={styles.resumoValue}>{horaSelecionada}</Text>
          </View>

          <View style={styles.resumoItem}>
            <Text style={styles.resumoLabel}>Valor:</Text>
            <Text style={styles.resumoValue}>
              {servicoSelecionadoObj
                ? `R$ ${servicoSelecionadoObj.preco.toFixed(2)}`
                : "R$ 0,00"}
            </Text>
          </View>

          <View style={styles.resumoItem}>
            <Text style={styles.resumoLabel}>Profissional:</Text>
            <Text style={styles.resumoValue}>{profissionalSelecionado}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.agendarButton}
          onPress={confirmarAgendamento}
          disabled={agendando}
        >
          {agendando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.agendarButtonText}>Confirmar</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Agendar Serviço</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Serviço</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setIsServicoModalVisible(true)}
          disabled={loadingServicos}
        >
          <Text style={styles.dropdownText}>
            {loadingServicos
              ? "Carregando..."
              : servicoSelecionado || "Selecione um serviço"}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profissional</Text>
        {loadingProfissionais ? (
          <ActivityIndicator
            color="#fff"
            size="small"
            style={styles.loadingIndicator}
          />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.profissionaisContainer}
          >
            {profissionais.map((prof: string, index: number) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.profissionalItem,
                  profissionalSelecionado === prof &&
                    styles.profissionalSelecionado,
                ]}
                onPress={() => setProfissionalSelecionado(prof)}
              >
                <Text style={styles.profissionalText}>{prof}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <View style={styles.calendarioHeader}>
          <TouchableOpacity onPress={voltarMes}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mesAnoContainer}
            onPress={() => setIsMesModalVisible(true)}
          >
            <Text style={styles.mesAno}>
              {meses[mesSelecionado]} {anoSelecionado}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={avancarMes}>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.diasSemana}>
          {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"].map(
            (dia: string, index: number) => (
              <Text key={index} style={styles.diaSemana}>
                {dia}
              </Text>
            )
          )}
        </View>

        {semanasCalendario.map((semana, semanaIndex: number) => (
          <View key={semanaIndex} style={styles.semanaContainer}>
            {semana.map((dia, diaIndex: number) => (
              <TouchableOpacity
                key={diaIndex}
                style={[
                  styles.diaItem,
                  !dia && styles.diaVazio,
                  dataSelecionada === dia && styles.diaSelecionado,
                  dia && isDataPassada(dia) && styles.diaPassado,
                ]}
                onPress={() =>
                  dia && !isDataPassada(dia) && setDataSelecionada(dia)
                }
                disabled={!dia || isDataPassada(dia)}
              >
                {dia ? (
                  <Text
                    style={[
                      styles.diaText,
                      dataSelecionada === dia && styles.diaTextSelecionado,
                      isDataPassada(dia) && styles.diaTextPassado,
                    ]}
                  >
                    {dia}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Horário</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horariosContainer}
        >
          {horarios.map((hora: string, index: number) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.horarioItem,
                horaSelecionada === hora && styles.horarioSelecionado,
              ]}
              onPress={() => setHoraSelecionada(hora)}
            >
              <Text
                style={[
                  styles.horarioText,
                  horaSelecionada === hora && styles.horarioTextSelecionado,
                ]}
              >
                {hora}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={[
          styles.agendarButton,
          !dataSelecionada && styles.agendarButtonDisabled,
        ]}
        onPress={() => setEtapa(2)}
        disabled={!dataSelecionada}
      >
        <Text style={styles.agendarButtonText}>Avançar</Text>
      </TouchableOpacity>

      {/* Modal de seleção de serviço */}
      <RNModal
        visible={isServicoModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.ContainerModal}>
            <Text style={styles.titleModal}>Selecione um Serviço</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {servicos.map((servico: Servico) => (
                <TouchableOpacity
                  key={servico.id}
                  style={[
                    styles.buttonModal,
                    servicoSelecionado === servico.nome && {
                      backgroundColor: Colors.green,
                    },
                  ]}
                  onPress={() => {
                    setServicoSelecionado(servico.nome);
                    setIsServicoModalVisible(false);
                  }}
                >
                  <Text style={styles.buttonTextModal}>
                    {servico.nome} - R$ {servico.preco.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.buttonModal, { marginTop: 10 }]}
              onPress={() => setIsServicoModalVisible(false)}
            >
              <Text style={styles.buttonTextModal}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </RNModal>

      {/* Modal de seleção de mês */}
      <RNModal
        visible={isMesModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.ContainerModal}>
            <Text style={styles.titleModal}>Selecione o Mês</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {meses.map((mes, index) => (
                <TouchableOpacity
                  key={mes}
                  style={[
                    styles.buttonModal,
                    mesSelecionado === index && {
                      backgroundColor: Colors.green,
                    },
                  ]}
                  onPress={() => {
                    setMesSelecionado(index);
                    setIsMesModalVisible(false);
                  }}
                >
                  <Text style={styles.buttonTextModal}>
                    {mes} {anoSelecionado}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.buttonModal, { marginTop: 10 }]}
              onPress={() => setIsMesModalVisible(false)}
            >
              <Text style={styles.buttonTextModal}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </RNModal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingVertical: 20,
    backgroundColor: Colors.dark.section,
    marginTop: 50,
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
  section: {
    padding: 16,
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: Colors.dark.section,
    marginHorizontal: 16,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 6,
  },
  dropdownText: {
    fontSize: 16,
    color: "#fff",
  },
  profissionaisContainer: {
    flexDirection: "row",
    marginTop: 8,
  },
  profissionalItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 20,
    marginRight: 8,
  },
  profissionalSelecionado: {
    borderColor: "#228B22",
    backgroundColor: Colors.green,
  },
  profissionalText: {
    fontSize: 14,
    color: "#fff",
  },
  loadingIndicator: {
    marginVertical: 10,
  },
  calendarioHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  mesAnoContainer: {
    flex: 1,
    alignItems: "center",
  },
  mesAno: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  diasSemana: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  diaSemana: {
    width: 40,
    textAlign: "center",
    fontSize: 12,
    color: "#fff",
    fontWeight: "bold",
  },
  semanaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  diaItem: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  diaVazio: {
    backgroundColor: "transparent",
  },
  diaSelecionado: {
    backgroundColor: "#228B22",
  },
  diaPassado: {
    opacity: 0.5,
  },
  diaText: {
    fontSize: 16,
    color: "#fff",
  },
  diaTextSelecionado: {
    color: "#fff",
    fontWeight: "bold",
  },
  diaTextPassado: {
    color: "#999",
  },
  horariosContainer: {
    flexDirection: "row",
    marginTop: 8,
  },
  horarioItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 6,
    marginRight: 8,
  },
  horarioSelecionado: {
    borderColor: "#228B22",
    backgroundColor: "#e8f5e9",
  },
  horarioText: {
    fontSize: 14,
    color: "#fff",
  },
  horarioTextSelecionado: {
    color: "#228B22",
    fontWeight: "bold",
  },
  agendarButton: {
    backgroundColor: "#228B22",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 16,
  },
  agendarButtonDisabled: {
    backgroundColor: "#666",
    opacity: 0.7,
  },
  agendarButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  resumoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#fff",
  },
  resumoLabel: {
    fontSize: 16,
    color: "#fff",
  },
  resumoValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  ContainerModal: {
    backgroundColor: Colors.dark.background,
    padding: 20,
    borderRadius: 8,
    width: "80%",
    maxHeight: "80%",
  },
  titleModal: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.dark.text,
    marginBottom: 15,
    textAlign: "center",
  },
  messageModal: {
    fontSize: 16,
    color: Colors.dark.text,
    textAlign: "center",
    marginBottom: 20,
  },
  buttonModal: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: "center",
  },
  buttonTextModal: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AgendarScreen;

import { useState, useEffect } from "react";
import { useAuth } from "../src/contexts/AuthContext";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  Modal,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
import { supabase } from "../src/supabase";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import dayjs from "dayjs";
import AsyncStorage from "@react-native-async-storage/async-storage";

const carouselData = [
  { id: 1, image: require("../assets/images/download1.jpg") },
  { id: 2, image: require("../assets/images/download2.jpg") },
  { id: 3, image: require("../assets/images/download3.jpg") },
];

interface Appointment {
  id: number;
  data_hora: string;
  barbeiro_id: number;
  servico_id: number;
  status: string;
  usuario_id: number;
  barbeiro?: {
    nome: string;
  };
  servico?: {
    nome: string;
  };
}

export default function HomeScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [userPlan, setUserPlan] = useState("Plano Básico");
  const [cutCount, setCutCount] = useState(0);
  const [futureAppointments, setFutureAppointments] = useState<Appointment[]>(
    []
  );
  const [modalVisible, setModalVisible] = useState(false);
  const { width, height } = Dimensions.get("window");

  useEffect(() => {
    const fetchAgendamentos = async () => {
      if (!session?.user?.id) return;

      const savedCount = await AsyncStorage.getItem("@cutCount");
      const initialCount = savedCount ? parseInt(savedCount) : 0;

      const { data, error } = await supabase
        .from("agendamentos")
        .select(
          `
        id,
        data_hora,
        barbeiro_id,
        servico_id,
        status,
        usuario_id,
        barbeiro:barbeiro_id ( nome ),
        servico:servico_id ( nome )
      `
        )
        .eq("usuario_id", session.user.id)
        .order("data_hora", { ascending: true });

      if (error) {
        console.error("Erro ao buscar agendamentos:", error.message);
        Alert.alert("Erro", "Não foi possível carregar seus agendamentos.");
      } else if (data) {
        const appointments = data.map((item) => ({
          ...item,
          barbeiro: Array.isArray(item.barbeiro)
            ? item.barbeiro[0]
            : item.barbeiro,
          servico: Array.isArray(item.servico) ? item.servico[0] : item.servico,
        }));

        const hoje = dayjs().startOf("day");

        const futuros = appointments.filter(
          (item: Appointment) =>
            dayjs(item.data_hora).isAfter(hoje) && item.status !== "Cancelado"
        );

        const concluidos = appointments.filter(
          (item: Appointment) => item.status === "Concluido"
        );

        setFutureAppointments(futuros);
        setCutCount(concluidos.length);
      }
    };

    fetchAgendamentos();
  }, [session]);

  useEffect(() => {
    if (cutCount >= 10) {
      setModalVisible(true);
    }
  }, [cutCount]);

  const handleCloseModal = async () => {
    setModalVisible(false);
    setCutCount(0);
    await AsyncStorage.setItem("@cutCount", "0");
    console.log("Contador zerado e salvo!");
  };


  const handleCancelAppointment = (appointmentId: number) => {
    Alert.alert(
      "Cancelar Agendamento",
      "Tem certeza que deseja cancelar este agendamento?",
      [
        { text: "Não", style: "cancel" },
        { text: "Sim", onPress: () => cancelAppointment(appointmentId) },
      ]
    );
  };

  const cancelAppointment = async (appointmentId: number) => {
    try {
      const { error } = await supabase
        .from("agendamentos")
        .update({ status: "Cancelado" })
        .eq("id", appointmentId);

      if (error) throw error;

      setFutureAppointments((prev) =>
        prev.filter((item) => item.id !== appointmentId)
      );

      Alert.alert("Sucesso", "Agendamento cancelado com sucesso!");
    } catch (error) {
      console.error("Erro ao cancelar agendamento:", error);
      Alert.alert("Erro", "Não foi possível cancelar o agendamento.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.absoluteModalContainer}>
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={handleCloseModal}
          statusBarTranslucent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Parabéns!</Text>
              <Text style={styles.modalText}>Você ganhou um corte grátis</Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleCloseModal}
                testID="close-modal-button"
              >
                <Text style={styles.modalButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Carousel
            width={width - 32}
            height={250}
            autoPlay
            data={carouselData}
            scrollAnimationDuration={3500}
            renderItem={({ item }) => (
              <View style={styles.carouselItem}>
                <Image source={item.image} style={styles.carouselImage} />
              </View>
            )}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seu plano</Text>
          <View style={styles.planCard}>
            <Text style={styles.planName}>{userPlan}</Text>
            <Text style={styles.planProgress}>
              {cutCount}/10 cortes realizados
            </Text>

            <TouchableOpacity style={styles.planButton}>
              <Text style={styles.planButtonText}>Contrate um plano →</Text>
            </TouchableOpacity>

            <View style={styles.planLinks}>
              <Link href="/historico" asChild>
                <TouchableOpacity>
                  <Text style={styles.planLinkText}>Meus agendamentos</Text>
                </TouchableOpacity>
              </Link>
              <Link href="/historico" asChild>
                <TouchableOpacity>
                  <Text style={styles.planLinkText}>Ver tudo</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximos agendamentos</Text>

          {futureAppointments.length === 0 ? (
            <View style={styles.appointmentCard}>
              <Text style={styles.noAppointments}>
                Você não tem nenhum agendamento marcado
              </Text>
            </View>
          ) : (
            futureAppointments.map((item) => (
    <View key={item.id} style={styles.appointmentCard}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
          {dayjs(item.data_hora).format("DD/MM/YYYY")} às{" "}
          {dayjs(item.data_hora).format("HH:mm")}
        </Text>
        <View style={[
          styles.statusBadge,
          item.status === 'Agendado' && styles.statusAgendado,
          item.status === 'Concluido' && styles.statusConcluido,
          item.status === 'Cancelado' && styles.statusCancelado
        ]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={{ color: "#ccc", marginTop: 4 }}>
        Profissional: {item.barbeiro?.nome ?? "Não informado"}
      </Text>
      <Text style={{ color: "#ccc", marginTop: 2 }}>
        Serviço: {item.servico?.nome ?? "Não informado"}
      </Text>
      
      {item.status === 'Agendado' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancelAppointment(item.id)}
        >
          <Text style={{ color: "#fff" }}>Cancelar</Text>
        </TouchableOpacity>
      )}
    </View>
  ))
)}
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <Link href="/Home" asChild>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home" size={24} color="#228B22" />
            <Text style={styles.navTextActive}>Home</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/agendamento" asChild>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="calendar" size={24} color="#666" />
            <Text style={styles.navText}>Agendar</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/historico" asChild>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="time" size={24} color="#666" />
            <Text style={styles.navText}>Histórico</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/telaUsuario" asChild>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="person" size={24} color="#666" />
            <Text style={styles.navText}>Perfil</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111111",
    position: "relative",
  },
  content: {
    flex: 1,
    padding: 16,
    marginTop: 40,
    marginBottom: 60,
  },
  section: {
    marginTop: 10,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
    marginBottom: 12,
  },
  carouselItem: {
    flex: 1,
    overflow: "hidden",
  },
  carouselImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  planCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 8,
    padding: 16,
  },
  planName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  planProgress: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 16,
  },
  planButton: {
    marginBottom: 16,
  },
  planButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  planLinks: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 12,
  },
  planLinkText: {
    color: "#fff",
  },
  appointmentCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  noAppointments: {
    color: "#ccc",
    fontSize: 14,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    backgroundColor: "#1E1E1E",
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  navItem: {
    alignItems: "center",
  },
  navText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  navTextActive: {
    fontSize: 12,
    color: "#228B22",
    marginTop: 4,
  },
  absoluteModalContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cancelButton: {
    width: "30%",
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#ff4d4d",
    borderRadius: 6,
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: "#228B22",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

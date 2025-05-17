import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../src/supabase";
import { Colors } from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";

interface Barbeiro {
  id: number;
  nome: string;
  especialidade: string;
}

export default function BarbeirosScreen() {
  const [nome, setNome] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const navigation = useNavigation();

  useEffect(() => {
    carregarBarbeiros();
  }, []);

  const carregarBarbeiros = async () => {
    try {
      const { data, error } = await supabase
        .from("barbeiros")
        .select("*")
        .order("nome", { ascending: true });

      if (error) throw error;
      setBarbeiros(data || []);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar os barbeiros");
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    if (!nome || !especialidade) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }

    try {
      if (editandoId) {
        const { error } = await supabase
          .from("barbeiros")
          .update({ nome, especialidade })
          .eq("id", editandoId);

        if (error) throw error;
        setModalMessage("Barbeiro atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("barbeiros")
          .insert([{ nome, especialidade }]);

        if (error) throw error;
        setModalMessage("Barbeiro cadastrado com sucesso!");
      }

      setModalVisible(true);
      limparFormulario();
      await carregarBarbeiros();
    } catch (error) {
      Alert.alert("Erro", "Ocorreu um erro ao salvar o barbeiro.");
      console.error(error);
    }
  };

  const editarBarbeiro = (barbeiro: Barbeiro) => {
    setNome(barbeiro.nome);
    setEspecialidade(barbeiro.especialidade);
    setEditandoId(barbeiro.id);
  };

  const excluirBarbeiro = async (id: number) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir este barbeiro?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("barbeiros")
                .delete()
                .eq("id", id);

              if (error) throw error;

              setModalMessage("Barbeiro excluído com sucesso!");
              setModalVisible(true);
              await carregarBarbeiros();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir o barbeiro.");
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const limparFormulario = () => {
    setNome("");
    setEspecialidade("");
    setEditandoId(null);
  };

  return (
    <View style={styles.container}>
      {/* Botão de voltar */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.voltar}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.titulo}>
        {editandoId ? "Editar Barbeiro" : "Cadastro de Barbeiro"}
      </Text>

      <ScrollView style={styles.scrollContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nome"
          placeholderTextColor={Colors.white}
          value={nome}
          onChangeText={setNome}
        />

        <TextInput
          style={styles.input}
          placeholder="Especialidade"
          placeholderTextColor={Colors.white}
          value={especialidade}
          onChangeText={setEspecialidade}
          keyboardType="default"
          autoCorrect={true}
        />

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.botao, styles.botaoPrincipal]}
            onPress={handleSubmit}
          >
            <Text style={styles.textoBotao}>
              {editandoId ? "Atualizar" : "Cadastrar"}
            </Text>
          </TouchableOpacity>

          {editandoId && (
            <TouchableOpacity
              style={[styles.botao, styles.botaoCancelar]}
              onPress={limparFormulario}
            >
              <Text style={styles.textoBotao}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.listaTitulo}>Barbeiros Cadastrados</Text>

        <FlatList
          data={barbeiros}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.barbeiroItem}>
              <View style={styles.barbeiroInfo}>
                <Text style={styles.barbeiroNome}>{item.nome}</Text>
                <Text style={styles.barbeiroEspecialidade}>
                  {item.especialidade}
                </Text>
              </View>

              <View style={styles.barbeiroAcoes}>
                <TouchableOpacity
                  style={styles.acaoButton}
                  onPress={() => editarBarbeiro(item)}
                >
                  <Ionicons name="pencil" size={20} color={Colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.acaoButton}
                  onPress={() => excluirBarbeiro(item.id)}
                >
                  <Ionicons name="trash" size={20} color={Colors.red} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </ScrollView>

      {/* Modal */}
      {modalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false);
                if (!editandoId) limparFormulario();
              }}
            >
              <Text style={styles.modalButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.dark.background,
  },
  scrollContainer: {
    flex: 1,
  },
  voltar: {
    position: "absolute",
    top: 40,
    left: 20,
    padding: 5,
    zIndex: 1,
  },
  titulo: {
    fontSize: 23,
    fontWeight: "bold",
    color: Colors.white,
    textAlign: "center",
    marginBottom: 20,
    marginTop: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray,
    padding: 15,
    borderRadius: 8,
    color: Colors.white,
    marginBottom: 15,
    backgroundColor: Colors.dark.background,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 25,
  },
  botao: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
  },
  botaoPrincipal: {
    backgroundColor: Colors.primary,
  },
  botaoCancelar: {
    backgroundColor: Colors.red,
  },
  textoBotao: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: "bold",
  },
  listaTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.white,
    marginBottom: 15,
  },
  barbeiroItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.dark.section,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  barbeiroInfo: {
    flex: 1,
  },
  barbeiroNome: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  barbeiroEspecialidade: {
    color: Colors.gray,
    fontSize: 14,
  },
  barbeiroAcoes: {
    flexDirection: "row",
    gap: 15,
  },
  acaoButton: {
    padding: 8,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 100,
  },
  modalContainer: {
    backgroundColor: Colors.dark.background,
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: Colors.white,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    color: Colors.white,
    fontWeight: "bold",
  },
});

import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
} from "react-native";
import { supabase } from "../../src/supabase";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface Servico {
  id: number;
  nome: string;
  preco: number;
  duracao_minutos: number;
}

export default function ServicosScreen() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [duracao, setDuracao] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    carregarServicos();
  }, []);

  const carregarServicos = async () => {
    const { data, error } = await supabase
      .from("servicos")
      .select("*")
      .order("nome", { ascending: true });

    if (error) {
      Alert.alert("Erro", "Não foi possível carregar os serviços");
      console.error(error);
    } else {
      setServicos(data || []);
    }
  };

  const salvarServico = async () => {
    if (!nome || !preco || !duracao) {
      Alert.alert("Atenção", "Preencha todos os campos");
      return;
    }

    const servicoData = {
      nome,
      preco: parseFloat(preco),
      duracao_minutos: parseInt(duracao),
    };

    try {
      if (editandoId) {
        const { error } = await supabase
          .from("servicos")
          .update(servicoData)
          .eq("id", editandoId);

        if (error) throw error;
        Alert.alert("Sucesso", "Serviço atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("servicos").insert(servicoData);

        if (error) throw error;
        Alert.alert("Sucesso", "Serviço cadastrado com sucesso!");
      }

      setNome("");
      setPreco("");
      setDuracao("");
      setEditandoId(null);
      await carregarServicos();
    } catch (error) {
      Alert.alert("Erro", "Ocorreu um erro ao salvar o serviço");
      console.error(error);
    }
  };

  const editarServico = (servico: Servico) => {
    setNome(servico.nome);
    setPreco(servico.preco.toString());
    setDuracao(servico.duracao_minutos.toString());
    setEditandoId(servico.id);
  };

const excluirServico = async (id: number) => {
  Alert.alert(
    "Confirmar Exclusão",
    "Tem certeza que deseja excluir este serviço? Todos os agendamentos vinculados também serão removidos.",
    [
      {
        text: "Cancelar",
        style: "cancel"
      },
      {
        text: "Excluir",
        onPress: async () => {
          try {
            const { error: deleteAgendamentosError } = await supabase
              .from("agendamentos")
              .delete()
              .eq("servico_id", id);

            if (deleteAgendamentosError) throw deleteAgendamentosError;

            const { error: deleteServicoError } = await supabase
              .from("servicos")
              .delete()
              .eq("id", id);

            if (deleteServicoError) throw deleteServicoError;

            Alert.alert("Sucesso", "Serviço e agendamentos vinculados excluídos com sucesso!");
            await carregarServicos();
          } catch (error) {
            Alert.alert("Erro", "Não foi possível completar a exclusão");
            console.error("Erro ao excluir:", error);
          }
        }
      }
    ]
  );
};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/admin/TelaAdmin")}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Cadastro de Serviços</Text>
      </View>

      <ScrollView style={styles.formContainer}>
        <Text style={styles.label}>Nome do Serviço</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Corte de Cabelo"
          value={nome}
          onChangeText={setNome}
        />

        <Text style={styles.label}>Preço (R$)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 50.00"
          keyboardType="numeric"
          value={preco}
          onChangeText={setPreco}
        />

        <Text style={styles.label}>Duração (minutos)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 30"
          keyboardType="numeric"
          value={duracao}
          onChangeText={setDuracao}
        />

        <TouchableOpacity style={styles.button} onPress={salvarServico}>
          <Text style={styles.buttonText}>
            {editandoId ? "Atualizar Serviço" : "Cadastrar Serviço"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Serviços Cadastrados</Text>

        <FlatList
          data={servicos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.servicoItem}>
              <View style={styles.servicoInfo}>
                <Text style={styles.servicoNome}>{item.nome}</Text>
                <Text>
                  R$ {item.preco.toFixed(2)} - {item.duracao_minutos} min
                </Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => editarServico(item)}>
                  <Ionicons name="pencil" size={20} color="#4CAF50" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => excluirServico(item.id)}>
                  <Ionicons name="trash" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          scrollEnabled={false}
        />
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
  formContainer: {
    flex: 1,
  },
  label: {
    color: "white",
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    backgroundColor: "#1E1E1E",
    color: "white",
    padding: 12,
    borderRadius: 5,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#228B22",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginVertical: 20,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  servicoItem: {
    backgroundColor: "#1E1E1E",
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  servicoInfo: {
    flex: 1,
  },
  servicoNome: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  actions: {
    flexDirection: "row",
    gap: 15,
  },
});

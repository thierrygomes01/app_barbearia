import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContextAdmin";
import { supabase } from "../../src/supabase";

const corPrimaria = "#111111";
const corSecundaria = "#1E1E1E";
const corTexto = "#fff";
const corAccent = "#228B22";

type Barbeiro = {
  id: string;
  nome: string;
};

export default function TelaAdmin() {
  const { userData } = useAuth();
  const router = useRouter();

  const [cortesSemanais, setCortesSemanais] = useState<Record<string, number>>({});

  useEffect(() => {
  async function buscarBarbeiros() {
    console.log("Buscando barbeiros...");

    const { data: barbeiros, error: erroBarbeiros } = await supabase
      .from("barbeiros")
      .select("id, nome");

    if (erroBarbeiros) {
      console.error("Erro ao buscar barbeiros:", erroBarbeiros.message);
      return;
    }

    const dadosDashboard: Record<string, number> = {};

    const hoje = new Date();
    const inicioDaSemana = new Date(hoje);
    inicioDaSemana.setDate(hoje.getDate() - hoje.getDay());
    inicioDaSemana.setHours(0, 0, 0, 0);

    const fimDaSemana = new Date(inicioDaSemana);
    fimDaSemana.setDate(inicioDaSemana.getDate() + 7);
    fimDaSemana.setHours(23, 59, 59, 999);

    for (const barbeiro of barbeiros) {
      const { count, error: erroAgendamentos } = await supabase
        .from("agendamentos")
        .select("*", { count: "exact", head: true })
        .eq("barbeiro_id", barbeiro.id)
        .gte("data_hora", inicioDaSemana.toISOString())
        .lt("data_hora", fimDaSemana.toISOString());

      if (erroAgendamentos) {
        console.error(`Erro ao buscar agendamentos do barbeiro ${barbeiro.nome}:`, erroAgendamentos.message);
        dadosDashboard[barbeiro.nome] = 0;
      } else {
        dadosDashboard[barbeiro.nome] = count ?? 0;
      }
    }

    console.log("Dados atualizados do dashboard:", dadosDashboard);
    setCortesSemanais(dadosDashboard);
  }

  buscarBarbeiros();
}, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.textoBemVindo}>
          Bem-vindo, {userData?.nome || "Administrador"}!
        </Text>
      </View>

      <View style={styles.conteudo}>
        <Text style={styles.tituloSessao}>Dashboard de Cortes Semanais</Text>
        {Object.entries(cortesSemanais).map(([barbeiro, cortes]) => (
          <View key={barbeiro} style={styles.itemDashboard}>
            <Text style={styles.nomeBarbeiro}>{barbeiro}</Text>
            <Text style={styles.quantidadeCortes}>{cortes} cortes</Text>
          </View>
        ))}
      </View>

      <View style={styles.navegacaoInferior}>
        <TouchableOpacity style={styles.itemNavegacao}>
          <Ionicons name="bar-chart-outline" size={24} color={corAccent} />
          <Text style={[styles.textoNavegacao, { color: corAccent }]}>Dashboard</Text>
        </TouchableOpacity>

        <Link href="../admin/barbeiros" asChild>
          <TouchableOpacity style={styles.itemNavegacao}>
            <Ionicons name="person-add-outline" size={24} color={corTexto} />
            <Text style={styles.textoNavegacao}>Barbeiros</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/admin/servicos" asChild>
          <TouchableOpacity style={styles.itemNavegacao}>
            <Ionicons name="cut-outline" size={24} color={corTexto} />
            <Text style={styles.textoNavegacao}>Serviços</Text>
          </TouchableOpacity>
        </Link>

        <TouchableOpacity style={styles.itemNavegacao} onPress={() => router.push("/admin/perfilAdmin")}>
          <Ionicons name="settings-outline" size={24} color={corTexto} />
          <Text style={styles.textoNavegacao}>Configurações</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: corPrimaria,
  },
  header: {
    backgroundColor: corSecundaria,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomColor: "#333",
    marginTop: 50,
  },
  textoBemVindo: {
    fontSize: 20,
    fontWeight: "bold",
    color: corTexto,
    textAlign: "center",
  },
  conteudo: {
    flex: 1,
    padding: 16,
  },
  tituloSessao: {
    fontSize: 18,
    fontWeight: "bold",
    color: corTexto,
    marginBottom: 30,
    textAlign: "center",
  },
  itemDashboard: {
    backgroundColor: corSecundaria,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nomeBarbeiro: {
    fontSize: 16,
    color: corTexto,
  },
  quantidadeCortes: {
    fontSize: 16,
    fontWeight: "bold",
    color: corTexto,
  },
  navegacaoInferior: {
    backgroundColor: corSecundaria,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  itemNavegacao: {
    alignItems: "center",
  },
  textoNavegacao: {
    fontSize: 12,
    color: corTexto,
    marginTop: 4,
  },
});

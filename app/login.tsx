import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  Alert,
  Modal,
} from "react-native";
import { useState } from "react";
import { useRouter, Link, router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import { supabase } from "../src/supabase";
import { useAuth } from "../src/contexts/AuthContext";

const schema = yup.object().shape({
  email: yup.string().required("O email é obrigatório"),
  password: yup
    .string()
    .min(6, "A senha deve ter pelo menos 6 caracteres")
    .required("A senha é obrigatória"),
});

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  const { replace } = useRouter();
  const { loginAdmin } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
    },
    resolver: yupResolver(schema),
  });

  type FormData = {
    email: string;
    password: string;
  };

  async function handleSignIn(data: FormData) {
    console.log("handleSignIn chamado com os dados:", data);
    setLoading(true);
    console.log("Estado de loading:", loading);

    if (
      data.email === "admin@barberapp.com" &&
      data.password === "adminpassword"
    ) {
      console.log("Tentativa de login como administrador...");
      const isAdminLoggedIn = await loginAdmin(data.email, data.password);
      console.log("isAdminLoggedIn:", isAdminLoggedIn);
      if (isAdminLoggedIn) {
        console.log(
          "Login de administrador bem-sucedido. Navegando para TelaAdmin..."
        );
        setLoading(false);
        setTimeout(() => {
          router.replace("/admin/TelaAdmin");
        }, 100);
        return;
      } else {
        Alert.alert("Erro", "Falha ao fazer login como administrador.");
        setLoading(false);
        return;
      }
    }

    const { data: authResponse, error: authError } =
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

    if (authError) {
      Alert.alert("Erro ao logar", authError.message);
      setLoading(false);
      return;
    }

    if (authResponse?.user?.id) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("nome, email, telefone, data_nascimento")
        .eq("auth_id", authResponse.user.id)
        .single();

      if (userError) {
        console.error("Erro ao buscar dados do usuário:", userError);
        Alert.alert("Erro", "Não foi possível buscar os dados do usuário.");
      } else if (userData) {
        console.log("Dados do usuário logado:", userData);
        Alert.alert("Login Sucesso", `Bem-vindo(a), ${userData.nome}!`);
        replace("/Home");
      } else {
        Alert.alert("Aviso", "Dados do usuário não encontrados.");
        replace("/Home");
      }
    } else {
      Alert.alert("Erro", "ID do usuário não encontrado após o login.");
    }

    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.replace("/")}>
        <Ionicons name="arrow-back" size={24} color={Colors.white} />
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.txt1}>Login</Text>
      </View>

      <Text style={styles.textLabel}>Email</Text>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[
              styles.input,
              { fontSize: 18, padding: 5 },
              errors.email && { borderWidth: 1, borderColor: "#ff375b" },
            ]}
            placeholder="Digite seu email"
            placeholderTextColor="rgba(255, 255, 255, 0.2)"
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
          />
        )}
      />

      {errors.email && (
        <Text style={styles.labelError}>{errors.email.message}</Text>
      )}

      <Text style={styles.textLabel}>Senha</Text>

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[
              styles.input,
              { fontSize: 18, padding: 5 },
              errors.password && {
                borderWidth: 1,
                borderColor: "#ff375b",
              },
            ]}
            placeholder="Digite sua senha"
            placeholderTextColor="rgba(255, 255, 255, 0.2)"
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            secureTextEntry={true}
          />
        )}
      />

      {errors.password && (
        <Text style={styles.labelError}>{errors.password?.message}</Text>
      )}

      <View style={styles.linkCadastro}>
        <Link href={"/registrar"} asChild>
          <Text style={styles.buttonLink}>
            Ainda não possui uma conta? Cadastre-se
          </Text>
        </Link>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleSubmit(handleSignIn)}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Carregando..." : "Acessar"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#090A0A",
    gap: 10,
  },
  link: {
    position: "absolute",
    bottom: 15,
    right: 52,
    color: Colors.warning,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  inputModal: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  btn: {
    backgroundColor: "#228B22",
    padding: 10,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  fechar: {
    marginTop: 15,
    color: "red",
  },
  backButton: {
    backgroundColor: "rgba(255,255,255, 0.55)",
    alignSelf: "flex-start",
    padding: 8,
    borderRadius: 8,
    position: "relative",
    top: -15,
    marginBottom: 8,
    marginLeft: 10,
  },
  backText: {
    fontSize: 18,
    color: "#FFFFFF",
  },
  header: {
    marginBottom: 20,
  },
  txt1: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#fff",
  },
  textLabel: {
    alignSelf: "flex-start",
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 45,
    marginBottom: 5,
  },
  input: {
    width: "80%",
    height: 45,
    backgroundColor: "#111111",
    color: "#FFFFFF",
    borderRadius: 5,
    paddingHorizontal: 10,
    borderColor: "#1D1C1C",
    borderWidth: 2,
    marginBottom: 20,
  },
  labelError: {
    color: "#ff375b",
    fontSize: 14,
  },
  buttonContainer: {
    backgroundColor: "#111111",
    width: 200,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 5,
    borderColor: "#1D1C1C",
    borderWidth: 2,
  },
  buttonText: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
  },
  linkCadastro: {
    alignSelf: "flex-start",
    marginLeft: 43,
  },
  buttonLink: {
    color: "white",
    marginTop: -15,
    marginBottom: 35,
  },
});

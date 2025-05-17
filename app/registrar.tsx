import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Pressable,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import { Colors } from "../constants/Colors";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Link } from "expo-router";

import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from '../src/supabase'
import { createClient } from "@supabase/supabase-js";


const schema = yup.object({
  username: yup.string().required("Informe seu nome"),
  email: yup.string().email("Informe um email válido").required("Informe seu email"),
  telefone: yup
    .string()
    .min(9, "O número de telefone deve ter 9 dígitos.")
    .required("Informe seu telefone"),
  data_nascimento: yup
    .string()
    .matches(/^\d{2}\/\d{2}\/\d{4}$/, "Formato válido: DD/MM/AAAA")
    .required("Informe sua data de nascimento"),
  password: yup
    .string()
    .min(6, "A senha deve ter pelo menos 6 dígitos.")
    .required("Informe sua senha"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "As senhas não coincidem")
    .required("Confirme sua senha"),
});

function formatDateToISO(dateStr: string) {
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month}-${day}`;
}

export default function RegistrarScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: "",
      email: "",
      telefone: "",
      data_nascimento: "",
      password: "",
      confirmPassword: "",
    },
    resolver: yupResolver(schema),
  });

async function handleSignIn(data: any) {
  setLoading(true);

  try {
    const formattedDate = formatDateToISO(data.data_nascimento);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          nome: data.username,
          telefone: data.telefone,
          data_nascimento: formattedDate,
          tipo_usuario: 'cliente'
        }
      }
    });

    console.log("Resposta do signUp:", authData);

    if (authError) {
      console.error("Erro no signUp:", authError);
      Alert.alert("Erro", "Falha ao criar usuário. Tente novamente.");
      return;
    }

    if (!authData?.user?.id) {
      console.error("Erro: authData.user ou authData.user.id é nulo/undefined", authData, authError);
      Alert.alert("Erro", "Falha ao obter informações do usuário após o cadastro.");
      return;
    }

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user.id,
        nome: data.username,
        email: data.email,
        telefone: data.telefone,
        data_nascimento: formattedDate,
        tipo_usuario: 'cliente',
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error("Erro ao inserir dados do usuário:", insertError);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar seus dados.');
      await supabase.auth.admin.deleteUser(authData.user.id);
      return;
    }

    Alert.alert('Sucesso', 'Cadastro realizado com sucesso!');
    router.replace('/login');

  } catch (error: unknown) {
    let errorMessage = 'Ocorreu um erro durante o cadastro';

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    Alert.alert('Erro', errorMessage);
    console.error('Erro detalhado:', error);
  } finally {
    setLoading(false);
  }
}

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.white }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </Pressable>

          <Text style={styles.text1}>Tela de Cadastro</Text>

          <View style={styles.forms}>
            <Text style={styles.textLabel}>Nome completo</Text>
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    errors.username && {
                      borderWidth: 1,
                      borderColor: "#ff375b",
                    },
                  ]}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              )}
            />
            {errors.username && (
              <Text style={styles.labelError}>{errors.username?.message}</Text>
            )}

            <Text style={styles.textLabel}>Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    errors.email && {
                      borderWidth: 1,
                      borderColor: "#ff375b",
                    },
                  ]}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  keyboardType="email-address"
                />
              )}
            />
            {errors.email && (
              <Text style={styles.labelError}>{errors.email?.message}</Text>
            )}

            <Text style={styles.textLabel}>Telefone</Text>
            <Controller
              control={control}
              name="telefone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    errors.telefone && {
                      borderWidth: 1,
                      borderColor: "#ff375b",
                    },
                  ]}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  keyboardType="phone-pad"
                />
              )}
            />
            {errors.telefone && (
              <Text style={styles.labelError}>{errors.telefone?.message}</Text>
            )}

            <Text style={styles.textLabel}>Data de Nascimento (DD/MM/AAAA)</Text>
            <Controller
              control={control}
              name="data_nascimento"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    errors.data_nascimento && {
                      borderWidth: 1,
                      borderColor: "#ff375b",
                    },
                  ]}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  keyboardType="numeric"
                />
              )}
            />
            {errors.data_nascimento && (
              <Text style={styles.labelError}>{errors.data_nascimento?.message}</Text>
            )}

            <Text style={styles.textLabel}>Senha</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    errors.password && {
                      borderWidth: 1,
                      borderColor: "#ff375b",
                    },
                  ]}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  secureTextEntry
                />
              )}
            />
            {errors.password && (
              <Text style={styles.labelError}>{errors.password?.message}</Text>
            )}

            <Text style={styles.textLabel}>Confirmar senha</Text>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    errors.confirmPassword && {
                      borderWidth: 1,
                      borderColor: "#ff375b",
                    },
                  ]}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  secureTextEntry
                />
              )}
            />
            {errors.confirmPassword && (
              <Text style={styles.labelError}>
                {errors.confirmPassword?.message}
              </Text>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit(handleSignIn)}
            >
              <Text style={styles.buttonText}>
                {loading ? "Carregando..." : "Cadastrar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#090A0A",
  },
  backButton: {
    backgroundColor: "rgba(255,255,255, 0.55)",
    alignSelf: "flex-start",
    padding: 8,
    borderRadius: 8,
    marginTop: 25,
    marginBottom: 8,
    marginLeft: 10,
  },
  text1: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 80,
  },
  forms: {
    width: "80%",
    marginTop: -40,
    alignItems: "center",
  },
  textLabel: {
    fontSize: 20,
    fontWeight: "500",
    color: "#FFFFFF",
    alignSelf: "flex-start",
    marginBottom: -10,
  },
  input: {
    width: "100%",
    height: 45,
    backgroundColor: "#111111",
    color: "#FFFFFF",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginTop: 20,
    borderColor: "#1D1C1C",
    borderWidth: 2,
    marginBottom: 10,
  },
  buttonContainer: {
    width: 250,
    height: 50,
    marginTop: 35,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    borderColor: "#1D1C1C",
    borderWidth: 2,
    backgroundColor: "#111111",
  },
  buttonText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  },
  button: {
    borderRadius: 5,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  labelError: {
    alignSelf: "flex-start",
    color: "#ff375b",
    marginBottom: 8,
  },
});

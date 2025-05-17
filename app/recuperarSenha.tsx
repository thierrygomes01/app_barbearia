import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  Alert } from 'react-native';

export default function App() {
  const [senha, setSenha] = useState<string>('');
  const [confirmarSenha, setConfirmarSenha] = useState<string>('');

  const atualizarSenha = () => {
    if (senha === '' || confirmarSenha === '') {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    Alert.alert('Sucesso', 'Senha atualizada com sucesso!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Recuperação de Senha</Text>

      <TextInput
        style={styles.input}
        placeholder="Nova Senha"
        secureTextEntry
        value={senha}
        onChangeText={(text: string) => setSenha(text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirmar Senha"
        secureTextEntry
        value={confirmarSenha}
        onChangeText={(text: string) => setConfirmarSenha(text)}
      />

      <TouchableOpacity style={styles.botao} onPress={atualizarSenha}>
        <Text style={styles.botaoTexto}>Atualizar Senha</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f4f4f4',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  botao: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 5,
    marginTop: 10,
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
});

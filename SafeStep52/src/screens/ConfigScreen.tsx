import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator,
  Alert, StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectMQTT, disconnectMQTT, getMQTTStatus } from '../services/mqtt';

const COLORS = {
  navy: '#0A1628',
  blue: '#1565C0',
  red: '#D32F2F',
  white: '#FFFFFF',
  lightGray: '#F5F7FA',
  gray: '#90A4AE',
  darkGray: '#37474F',
};

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <View style={eyeStyles.container}>
      <View style={eyeStyles.outer}>
        <View style={eyeStyles.inner} />
      </View>
      {!visible && <View style={eyeStyles.slash} />}
    </View>
  );
}

const eyeStyles = StyleSheet.create({
  container: { width: 22, height: 22, justifyContent: 'center', alignItems: 'center' },
  outer: {
    width: 20, height: 14, borderRadius: 10,
    borderWidth: 2, borderColor: COLORS.gray,
    justifyContent: 'center', alignItems: 'center',
  },
  inner: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.gray },
  slash: {
    position: 'absolute', width: 24, height: 2,
    backgroundColor: COLORS.gray, transform: [{ rotate: '-40deg' }],
  },
});

export default function ConfigScreen({ navigation }: any) {
  const [mqttPass, setMqttPass] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [mqttConnected, setMqttConnected] = useState(false);
  const [showMqttPass, setShowMqttPass] = useState(false);

  useEffect(() => {
    loadMqttPassword();
    setMqttConnected(getMQTTStatus());
  }, []);

  const loadMqttPassword = async () => {
    const saved = await AsyncStorage.getItem('mqtt_password');
    if (saved) setMqttPass(saved);
  };

  const handleConnectMQTT = async () => {
    if (!mqttPass) { Alert.alert('Ingresa la contraseña del broker MQTT'); return; }
    setLoading(true);
    setStatus('Conectando al servidor MQTT...');
    await AsyncStorage.setItem('mqtt_password', mqttPass);
    await connectMQTT(mqttPass, (connected) => {
      setMqttConnected(connected);
      setStatus(connected ? '✓ Conectado al servidor MQTT' : 'Error al conectar');
    });
    setLoading(false);
  };

  const handleDisconnectMQTT = () => {
    disconnectMQTT();
    setMqttConnected(false);
    setStatus('Desconectado del servidor MQTT');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Configuración</Text>
          <Text style={styles.headerSub}>Notificaciones MQTT</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll}>

        <Text style={styles.sectionDesc}>
          Configura la conexión al servidor para recibir notificaciones de caídas y desconexiones.
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Servidor</Text>
          <Text style={styles.infoValue}>qd011661.ala.eu-central-1.emqxsl.com</Text>
          <Text style={styles.infoLabel}>Usuario</Text>
          <Text style={styles.infoValue}>safe_step</Text>
        </View>

        <Text style={styles.inputLabel}>Contraseña del broker</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.inputFlex}
            placeholder="Contraseña MQTT"
            value={mqttPass}
            onChangeText={setMqttPass}
            secureTextEntry={!showMqttPass}
            autoCapitalize="none"
            placeholderTextColor={COLORS.gray}
          />
          <TouchableOpacity
            onPress={() => setShowMqttPass(!showMqttPass)}
            style={styles.eyeBtn}
          >
            <EyeIcon visible={showMqttPass} />
          </TouchableOpacity>
        </View>

        <View style={styles.statusMqtt}>
          <View style={[styles.mqttDot, { backgroundColor: mqttConnected ? '#4CAF50' : COLORS.red }]} />
          <Text style={styles.mqttStatus}>
            {mqttConnected ? 'Conectado al servidor' : 'Sin conexión al servidor'}
          </Text>
        </View>

        {!mqttConnected ? (
          <TouchableOpacity
            style={[styles.btn, styles.btnBlue, !mqttPass && styles.btnDisabled]}
            onPress={handleConnectMQTT}
            disabled={loading || !mqttPass}
          >
            <Text style={styles.btnText}>Conectar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.btn, styles.btnRed]} onPress={handleDisconnectMQTT}>
            <Text style={styles.btnText}>Desconectar</Text>
          </TouchableOpacity>
        )}

        {loading && <ActivityIndicator style={{ marginTop: 16 }} color={COLORS.blue} />}
        {status ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        ) : null}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  header: {
    backgroundColor: COLORS.navy,
    paddingTop: 50, paddingBottom: 20, paddingHorizontal: 24,
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 18, color: COLORS.white },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.white },
  headerSub: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  scroll: { flex: 1, padding: 16 },
  sectionDesc: { fontSize: 14, color: COLORS.darkGray, marginBottom: 20, lineHeight: 20 },
  inputLabel: { fontSize: 13, color: COLORS.darkGray, fontWeight: '500', marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  inputFlex: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 12,
    padding: 14, fontSize: 15, borderWidth: 1,
    borderColor: '#E0E0E0', color: COLORS.navy,
  },
  eyeBtn: { padding: 12, marginLeft: 8 },
  infoCard: {
    backgroundColor: COLORS.white, borderRadius: 12,
    padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E0E0E0',
  },
  infoLabel: { fontSize: 11, color: COLORS.gray, marginBottom: 2, marginTop: 8 },
  infoValue: { fontSize: 14, color: COLORS.navy, fontWeight: '500' },
  statusMqtt: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  mqttDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  mqttStatus: { fontSize: 14, color: COLORS.darkGray },
  btn: { borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12 },
  btnBlue: { backgroundColor: COLORS.blue },
  btnRed: { backgroundColor: COLORS.red },
  btnDisabled: { backgroundColor: COLORS.gray },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  statusBox: {
    backgroundColor: COLORS.white, borderRadius: 12,
    padding: 14, marginTop: 8, borderWidth: 1, borderColor: '#E0E0E0',
  },
  statusText: { fontSize: 13, color: COLORS.darkGray, textAlign: 'center' },
});

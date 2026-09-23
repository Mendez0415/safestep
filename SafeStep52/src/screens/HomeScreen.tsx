import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, RefreshControl, StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { getMQTTStatus, getAlerts } from '../services/mqtt';

const COLORS = {
  navy: '#0A1628',
  blue: '#1565C0',
  lightBlue: '#1E88E5',
  red: '#D32F2F',
  white: '#FFFFFF',
  lightGray: '#F5F7FA',
  gray: '#90A4AE',
  darkGray: '#37474F',
  green: '#2E7D32',
};

export default function HomeScreen({ navigation }: any) {
  const [connected, setConnected] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setConnected(getMQTTStatus());
    const data = await getAlerts();
    setAlerts(data.slice(0, 5));
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
      hour12: true,
    });
  };

  const deleteAlert = async (index: number) => {
    const newAlerts = [...alerts];
    newAlerts.splice(index, 1);
    setAlerts(newAlerts);
    await AsyncStorage.setItem('safestep_alerts', JSON.stringify(newAlerts));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>SafeStep</Text>
          <Text style={styles.headerSub}>Panel de control</Text>
        </View>
        <TouchableOpacity
          style={styles.configBtn}
          onPress={() => navigation.navigate('Config')}
        >
          <Text style={styles.configBtnText}>⚙</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.blue} />
        }
      >
        {/* Estado del dispositivo */}
        <View style={[styles.statusCard, { borderLeftColor: connected ? COLORS.lightBlue : COLORS.red }]}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: connected ? '#4CAF50' : COLORS.red }]} />
            <View>
              <Text style={styles.statusLabel}>Estado del dispositivo</Text>
              <Text style={[styles.statusValue, { color: connected ? '#4CAF50' : COLORS.red }]}>
                {connected ? 'Conectado' : 'Desconectado'}
              </Text>
            </View>
          </View>
          <Text style={styles.statusHint}>
            {connected ? 'Monitoreando activamente' : 'Verificar conexión WiFi del dispositivo'}
          </Text>
        </View>

        {/* Alertas recientes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alertas recientes</Text>

          {alerts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>✓</Text>
              <Text style={styles.emptyText}>Sin alertas recientes</Text>
              <Text style={styles.emptyHint}>El dispositivo está operando normalmente</Text>
            </View>
          ) : (
            alerts.map((alert, index) => (
              <View
                key={index}
                style={[styles.alertCard, {
                  borderLeftColor: alert.type === 'caida' ? COLORS.red : COLORS.lightBlue
                }]}
              >
                <Text style={styles.alertIcon}>
                  {alert.type === 'caida' ? '🚨' : '⚠️'}
                </Text>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertTitle}>
                    {alert.type === 'caida' ? 'Alerta: Caída detectada' : 'Dispositivo desconectado'}
                  </Text>
                  <Text style={styles.alertTime}>{formatTime(alert.time)}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteAlert(index)} style={styles.deleteBtn}>
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Botón reconfigurar WiFi */}
        <TouchableOpacity
          style={styles.wifiBtn}
          onPress={() => navigation.navigate('WifiSetup')}
        >
          <View style={styles.wifiBtnContent}>
            <Text style={styles.wifiBtnIcon}>📶</Text>
            <View>
              <Text style={styles.wifiBtnTitle}>Reconfigurar WiFi</Text>
              <Text style={styles.wifiBtnSub}>Configurar nueva red en el dispositivo</Text>
            </View>
          </View>
          <Text style={styles.wifiBtnArrow}>›</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  header: {
    backgroundColor: COLORS.navy,
    paddingTop: 50, paddingBottom: 20, paddingHorizontal: 24,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: COLORS.white },
  headerSub: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  configBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  configBtnText: { fontSize: 20, color: COLORS.white },
  scroll: { flex: 1, padding: 16 },
  statusCard: {
    backgroundColor: COLORS.white, borderRadius: 16,
    padding: 20, marginBottom: 16, borderLeftWidth: 4,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  statusLabel: { fontSize: 12, color: COLORS.gray, marginBottom: 2 },
  statusValue: { fontSize: 18, fontWeight: '700' },
  statusHint: { fontSize: 13, color: COLORS.gray },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.darkGray, marginBottom: 12 },
  emptyCard: {
    backgroundColor: COLORS.white, borderRadius: 16,
    padding: 32, alignItems: 'center', elevation: 1,
  },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.darkGray },
  emptyHint: { fontSize: 13, color: COLORS.gray, marginTop: 4 },
  alertCard: {
    backgroundColor: COLORS.white, borderRadius: 12,
    padding: 16, flexDirection: 'row', alignItems: 'center',
    marginBottom: 8, borderLeftWidth: 4, elevation: 1,
  },
  alertIcon: { fontSize: 24, marginRight: 12 },
  alertInfo: { flex: 1 },
  alertTitle: { fontSize: 15, fontWeight: '600', color: COLORS.darkGray },
  alertTime: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  deleteBtn: { padding: 8 },
  deleteIcon: { fontSize: 18 },
  wifiBtn: {
    backgroundColor: COLORS.white, borderRadius: 14,
    padding: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 32, elevation: 1,
    borderLeftWidth: 4, borderLeftColor: COLORS.blue,
  },
  wifiBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wifiBtnIcon: { fontSize: 24 },
  wifiBtnTitle: { fontSize: 15, fontWeight: '600', color: COLORS.darkGray },
  wifiBtnSub: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  wifiBtnArrow: { fontSize: 24, color: COLORS.gray },
});

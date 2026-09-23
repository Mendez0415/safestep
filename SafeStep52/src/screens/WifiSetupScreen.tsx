import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Linking, StatusBar,
} from 'react-native';

import { publishMQTT } from '../services/mqtt';
const COLORS = {
  navy: '#0A1628',
  blue: '#1565C0',
  lightBlue: '#1E88E5',
  red: '#D32F2F',
  white: '#FFFFFF',
  lightGray: '#F5F7FA',
  gray: '#90A4AE',
  darkGray: '#37474F',
  orange: '#E65100',
  green: '#2E7D32',
};

const STEPS = [
  {
    number: 1,
    title: 'Activar modo configuración',
    desc: 'Presiona el botón de abajo para poner el dispositivo en modo configuración.',
    icon: '',
    
  },
  {
    number: 2,
    title: 'Conectarte a la red SafeStep',
    desc: 'Ve a Ajustes WiFi de tu celular y conéctate a la red llamada "SafeStep". Regresa a esta app una vez conectado.',
    icon: '',
  },
  {
    number: 3,
    title: 'Configurar las credenciales',
    desc: 'Presiona el botón de abajo para abrir la página de configuración. Ingresa el nombre y contraseña de tu red WiFi y guarda.',
    icon: '',
  },
  {
    number: 4,
    title: 'Esperar reconexión',
    desc: '',
    icon: '',
  },
];

export default function WifiSetupScreen({ navigation }: any) {
  const [currentStep, setCurrentStep] = useState(1);
  const [apActivated, setApActivated] = useState(false);

  const handleActivateAP = () => {
    Alert.alert(
      '⚠️ Advertencia',
      'Al activar el modo configuración se borrarán las credenciales WiFi actuales del dispositivo y se desconectará de la red.\n\n¿Estás seguro de continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, continuar',
          style: 'destructive',
          onPress: () => {
            setApActivated(true);
            setCurrentStep(2);
            // Aquí se mandará la orden por MQTT cuando integremos el ESP32
            publishMQTT('baston/config', 'RESET');
          },
        },
      ]
    );
  };

  const handleOpenConfigPage = () => {
    Linking.openURL('http://192.168.4.1').catch(() => {
      Alert.alert(
        'No se pudo abrir la página',
        'Asegúrate de estar conectado a la red "SafeStep-Config" e intenta de nuevo.',
        [{ text: 'OK' }]
      );
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Configurar WiFi</Text>
          <Text style={styles.headerSub}>Sigue los pasos</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Indicador de progreso */}
        <View style={styles.progressContainer}>
          {STEPS.map((step) => (
            <View key={step.number} style={styles.progressItem}>
              <View style={[
                styles.progressDot,
                currentStep === step.number && styles.progressDotActive,
                currentStep > step.number && styles.progressDotDone,
              ]}>
                <Text style={styles.progressDotText}>
                  {currentStep > step.number ? '✓' : step.number}
                </Text>
              </View>
              {step.number < STEPS.length && (
                <View style={[
                  styles.progressLine,
                  currentStep > step.number && styles.progressLineDone,
                ]} />
              )}
            </View>
          ))}
        </View>

        {/* Pasos */}
        {STEPS.map((step) => (
          <View
            key={step.number}
            style={[
              styles.stepCard,
              currentStep === step.number && styles.stepCardActive,
              currentStep < step.number && styles.stepCardDisabled,
            ]}
          >
            <View style={styles.stepHeader}>
              <Text style={styles.stepIcon}>{step.icon}</Text>
              <View style={styles.stepTitleContainer}>
                <Text style={styles.stepNumber}>Paso {step.number}</Text>
                <Text style={[
                  styles.stepTitle,
                  currentStep < step.number && styles.stepTitleDisabled,
                ]}>
                  {step.title}
                </Text>
              </View>
              {currentStep > step.number && (
                <Text style={styles.stepDone}>✓</Text>
              )}
            </View>

            {currentStep >= step.number && (
              <Text style={styles.stepDesc}>{step.desc}</Text>
            )}

            {/* Botón paso 1 */}
            {step.number === 1 && currentStep === 1 && (
              <TouchableOpacity
                style={[styles.btn, styles.btnRed]}
                onPress={handleActivateAP}
                
                
              >
                <Text style={styles.btnText}>Activar modo configuración</Text>
              </TouchableOpacity>
            )}

            {/* Botón paso 2 */}
            {step.number === 2 && currentStep === 2 && (
              <View>
                <View style={styles.networkCard}>
                  <Text style={styles.networkLabel}>Red a conectarse:</Text>
                  <Text style={styles.networkName}>SafeStep</Text>
                  <Text style={styles.networkHint}>Sin contraseña</Text>
                </View>
                <TouchableOpacity
                  style={[styles.btn, styles.btnBlue]}
                  onPress={() => setCurrentStep(3)}
                >
                  <Text style={styles.btnText}>Ya estoy conectado</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Botón paso 3 */}
            {step.number === 3 && currentStep === 3 && (
              <View>
                <TouchableOpacity
                  style={[styles.btn, styles.btnBlue]}
                  onPress={handleOpenConfigPage}
                >
                  <Text style={styles.btnText}>Abrir página de configuración</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnGreen, { marginTop: 8 }]}
                  onPress={() => setCurrentStep(4)}
                >
                  <Text style={styles.btnText}>Ya guardé las credenciales</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Paso 4 - final */}
            {step.number === 4 && currentStep === 4 && (
              <View>
                <View style={styles.successCard}>
                  <Text style={styles.successIcon}></Text>
                  <Text style={styles.successText}>
                    El dispositivo se está reconectando. Espera unos segundos....
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.btn, styles.btnNavy]}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.btnText}>Volver al inicio</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

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
  progressContainer: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginBottom: 24, paddingHorizontal: 8,
  },
  progressItem: { flexDirection: 'row', alignItems: 'center' },
  progressDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center', alignItems: 'center',
  },
  progressDotActive: { backgroundColor: COLORS.blue },
  progressDotDone: { backgroundColor: COLORS.green },
  progressDotText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  progressLine: { width: 40, height: 2, backgroundColor: '#E0E0E0' },
  progressLineDone: { backgroundColor: COLORS.green },
  stepCard: {
    backgroundColor: COLORS.white, borderRadius: 16,
    padding: 18, marginBottom: 12, elevation: 1,
    borderLeftWidth: 4, borderLeftColor: '#E0E0E0',
  },
  stepCardActive: { borderLeftColor: COLORS.blue, elevation: 3 },
  stepCardDisabled: { opacity: 0.5 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  stepIcon: { fontSize: 24, marginRight: 12 },
  stepTitleContainer: { flex: 1 },
  stepNumber: { fontSize: 11, color: COLORS.gray, marginBottom: 2 },
  stepTitle: { fontSize: 15, fontWeight: '600', color: COLORS.darkGray },
  stepTitleDisabled: { color: COLORS.gray },
  stepDone: { fontSize: 20, color: COLORS.green },
  stepDesc: { fontSize: 13, color: COLORS.darkGray, lineHeight: 20, marginBottom: 14 },
  btn: { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  btnRed: { backgroundColor: COLORS.red },
  btnBlue: { backgroundColor: COLORS.blue },
  btnGreen: { backgroundColor: COLORS.green },
  btnNavy: { backgroundColor: COLORS.navy },
  btnText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  networkCard: {
    backgroundColor: COLORS.lightGray, borderRadius: 10,
    padding: 14, marginBottom: 12, alignItems: 'center',
  },
  networkLabel: { fontSize: 12, color: COLORS.gray, marginBottom: 4 },
  networkName: { fontSize: 18, fontWeight: '700', color: COLORS.navy },
  networkHint: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  successCard: {
    backgroundColor: '#E8F5E9', borderRadius: 12,
    padding: 16, alignItems: 'center', marginBottom: 14,
  },
  successIcon: { fontSize: 32, marginBottom: 8 },
  successText: { fontSize: 13, color: COLORS.darkGray, textAlign: 'center', lineHeight: 20 },
});

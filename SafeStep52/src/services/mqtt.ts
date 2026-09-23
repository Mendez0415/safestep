import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const MQTT_CONFIG = {
  host: 'qd011661.ala.eu-central-1.emqxsl.com',
  port: 8084,
  username: 'safe_step',
  clientId: 'SafeStepApp_' + Math.random().toString(16).substr(2, 8),
  topics: {
    estado: 'baston/estado',
    caida: 'baston/caida',
  },
};

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let isConnected = false;
let savedPassword = '';
let onStatusChange: ((connected: boolean) => void) | null = null;

export async function setupNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function sendLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
}

export async function connectMQTT(
  password: string,
  onStatus?: (connected: boolean) => void
) {
  savedPassword = password;
  onStatusChange = onStatus || null;

  if (ws) { ws.close(); ws = null; }

  const url = `wss://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}/mqtt`;
  ws = new WebSocket(url, ['mqtt']);

  ws.binaryType = 'arraybuffer';

  ws.onopen = () => {
    const connectPacket = buildConnectPacket(
      MQTT_CONFIG.clientId, MQTT_CONFIG.username, password
    );
    ws?.send(connectPacket);
  };

  ws.onmessage = (event) => { handleMQTTMessage(event.data); };

  ws.onerror = () => {
    isConnected = false;
    onStatusChange?.(false);
    scheduleReconnect();
  };

  ws.onclose = () => {
    isConnected = false;
    onStatusChange?.(false);
    scheduleReconnect();
  };
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    connectMQTT(savedPassword, onStatusChange || undefined);
  }, 5000);
}

async function handleMQTTMessage(data: ArrayBuffer) {
  try {
    const buffer = new Uint8Array(data);
    const packetType = (buffer[0] >> 4) & 0x0f;

    if (packetType === 2) {
      isConnected = true;
      onStatusChange?.(true);
      subscribeToTopics();
    }

    if (packetType === 3) {
      const { topic, payload } = parsePublishPacket(buffer);

      if (topic === MQTT_CONFIG.topics.estado && payload === 'OFFLINE') {
        await sendLocalNotification(
          'Dispositivo desconectado',
          'SafeStep perdió la conexión WiFi'
        );
        await saveAlert({ type: 'desconexion', time: new Date().toISOString() });
      }

      if (topic === MQTT_CONFIG.topics.caida) {
        await sendLocalNotification(
          '¡Caída detectada!',
          'SafeStep detectó una posible caída'
        );
        await saveAlert({ type: 'caida', time: new Date().toISOString() });
      }
    }
  } catch (e) {}
}

async function saveAlert(alert: { type: string; time: string }) {
  try {
    const existing = await AsyncStorage.getItem('safestep_alerts');
    const alerts = existing ? JSON.parse(existing) : [];
    alerts.unshift(alert);
    await AsyncStorage.setItem('safestep_alerts', JSON.stringify(alerts.slice(0, 50)));
  } catch (e) {}
}

export async function getAlerts() {
  const data = await AsyncStorage.getItem('safestep_alerts');
  return data ? JSON.parse(data) : [];
}

export function getMQTTStatus() { return isConnected; }

export function disconnectMQTT() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  ws?.close();
  ws = null;
  isConnected = false;
}

function subscribeToTopics() {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  [MQTT_CONFIG.topics.estado, MQTT_CONFIG.topics.caida].forEach((topic) => {
    ws?.send(buildSubscribePacket(topic));
  });
}

function buildConnectPacket(clientId: string, username: string, password: string): Uint8Array {
  const enc = new TextEncoder();
  const cid = enc.encode(clientId);
  const usr = enc.encode(username);
  const pwd = enc.encode(password);
  const payload = new Uint8Array([
    0,4,77,81,84,84, 4, 0xC2, 0,60,
    0,cid.length,...cid,
    0,usr.length,...usr,
    0,pwd.length,...pwd,
  ]);
  return new Uint8Array([0x10, payload.length, ...payload]);
}

function buildSubscribePacket(topic: string): Uint8Array {
  const enc = new TextEncoder();
  const t = enc.encode(topic);
  const payload = new Uint8Array([0,1, 0,t.length,...t, 0]);
  return new Uint8Array([0x82, payload.length, ...payload]);
}

function parsePublishPacket(buffer: Uint8Array): { topic: string; payload: string } {
  const dec = new TextDecoder();
  let i = 1;
  while (buffer[i] & 0x80) i++;
  i++;
  const topicLen = (buffer[i] << 8) | buffer[i+1];
  i += 2;
  const topic = dec.decode(buffer.slice(i, i + topicLen));
  i += topicLen;
  return { topic, payload: dec.decode(buffer.slice(i)) };
}

// ── REEMPLAZAR DESDE LA LÍNEA 181 HASTA EL FINAL ──────────────────

export function publishMQTT(topic: string, message: string) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.log('MQTT no conectado');
    return;
  }
  ws.send(buildPublishPacket(topic, message));
}

function buildPublishPacket(topic: string, message: string): Uint8Array {
  const enc = new TextEncoder();
  const t = enc.encode(topic);
  const m = enc.encode(message);
  const payload = new Uint8Array([
    0, t.length, ...t,
    ...m,
  ]);
  return new Uint8Array([0x30, payload.length, ...payload]);
}

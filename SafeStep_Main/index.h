#pragma once
const char* index_html = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Configuración WiFi</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background-color: #F5F7FA;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #37474F;
    }

    .header {
      background-color: #0A1628;
      color: #FFFFFF;
      width: 100%;
      text-align: center;
      padding: 24px 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .header h1 {
      font-size: 35px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .header span {
      color: #90A4AE;
      font-size: 15px;
      display: block;
      margin-top: 4px;
      font-weight: 400;
    }

    .card {
      background: #FFFFFF;
      border-radius: 16px;
      padding: 28px 24px;
      margin: 32px 16px;
      width: calc(100% - 32px);
      max-width: 400px;
      box-shadow: 0 4px 16px rgba(10, 22, 40, 0.06);
      border: 1px solid #E2E8F0;
    }

    .card-title {
      text-align: center;
      font-size: 18px;
      font-weight: 700;
      color: #0A1628;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #F1F5F9;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 16px;
    }

    .field label {
      font-size: 14px;
      font-weight: 600;
      color: #0A1628;
    }

    .field input {
      background: #F8FAFC;
      border: 1.5px solid #CBD5E1;
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 15px;
      color: #0A1628;
      outline: none;
      transition: all 0.2s ease;
    }

    .field input::placeholder {
      color: #94A3B8;
    }

    .field input:focus {
      border-color: #1565C0;
      background: #FFFFFF;
      box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.12);
    }

    .btn {
      display: block;
      width: 100%;
      padding: 14px;
      background-color: #1565C0;
      color: #FFFFFF;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      margin-top: 24px;
      cursor: pointer;
      transition: background-color 0.2s ease, transform 0.1s ease;
    }

    .btn:hover {
      background-color: #1E88E5;
    }

    .btn:active {
      background-color: #0D47A1;
      transform: scale(0.99);
    }

    .status {
      text-align: center;
      margin-top: 14px;
      font-size: 14px;
      font-weight: 500;
      min-height: 20px;
    }

    .status.ok  { color: #2E7D32; }
    .status.err { color: #D32F2F; }
  </style>
</head>
<body>

  <div class="header">
    <h1>SafeStep</h1>
    <span>Configuración de Red WiFi</span>
  </div>

  <div class="card">
    <div class="card-title">Ingresa las credenciales</div>

    <div class="field">
      <label for="ssid">Nombre de la red (SSID)</label>
      <input type="text" id="ssid" placeholder="Ej. MiRedWiFi">
    </div>

    <div class="field">
      <label for="pass">Contraseña</label>
      <input type="text" id="pass" placeholder="••••••••">
    </div>

    <button class="btn" onclick="guardar()">Conectar</button>
    <div class="status" id="status"></div>
  </div>

</body>
<script>
  function guardar() {
    const ssid = document.getElementById('ssid').value;
    const pass = document.getElementById('pass').value;
    const status = document.getElementById('status');

    if (ssid.trim() === '') {
      status.className = 'status err';
      status.innerText = 'El SSID no puede estar vacío';
      return;
    }

    status.className = 'status';
    status.innerText = 'Guardando credenciales...';

    fetch('/update?ssid=' + encodeURIComponent(ssid) + '&pass=' + encodeURIComponent(pass))
      .then(() => {
        status.className = 'status ok';
        status.innerText = '✓ Guardado correctamente';
      })
      .catch(() => {
        status.className = 'status err';
        status.innerText = 'Error al guardar. Intenta de nuevo.';
      });
  }
</script>
</html>
)rawliteral";
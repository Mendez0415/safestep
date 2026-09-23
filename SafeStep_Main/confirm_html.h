#pragma once

const char* confirm_html = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación</title>
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
      text-align: center;
      box-shadow: 0 4px 16px rgba(10, 22, 40, 0.06);
      border: 1px solid #E2E8F0;
    }

    .card-title {
      font-size: 18px;
      font-weight: 700;
      color: #0A1628;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #F1F5F9;
    }

    .card-text {
      color: #475569;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 24px;
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
      cursor: pointer;
      text-decoration: none;
      transition: background-color 0.2s ease, transform 0.1s ease;
    }

    .btn:hover {
      background-color: #1E88E5;
    }

    .btn:active {
      background-color: #0D47A1;
      transform: scale(0.99);
    }
  </style>
</head>
<body>

  <div class="header">
    <h1>SafeStep</h1>
    <span>Modo de Confirmación</span>
  </div>

  <div class="card">
    <div class="card-title">Reconfigurar WiFi</div>
    <p class="card-text">
      OJO: Si el dispositivo vuelve a detectar la red guardada se reconectará automáticamente.<br><br>
      Presiona el botón solo si deseas reconfigurar.
    </p>
    <a class="btn" href="/reconfig">Reconfigurar WiFi</a>
  </div>

</body>
</html>
)rawliteral";

// start.js - Prepara las variables de entorno e inicia Probot correctamente

// Decodificar private key de base64 ANTES de que Probot inicie
if (process.env.PRIVATE_KEY_BASE64 && !process.env.PRIVATE_KEY) {
  console.log('🔑 Decodificando private key desde base64...');
  process.env.PRIVATE_KEY = Buffer.from(process.env.PRIVATE_KEY_BASE64, 'base64').toString('utf8');
  console.log('✅ Private key decodificada correctamente');
}

// Importar y ejecutar Probot directamente (no con execSync)
const { Probot, Server } = require('probot');
const app = require('./index.js');

async function start() {
  const server = new Server({
    Probot: Probot.defaults({
      appId: process.env.APP_ID,
      privateKey: process.env.PRIVATE_KEY,
      secret: process.env.WEBHOOK_SECRET
    })
  });

  await server.load(app);
  await server.start();
  console.log('✅ Servidor de Probot iniciado correctamente');
}

start().catch((error) => {
  console.error('❌ Error al iniciar el servidor:', error);
  process.exit(1);
});
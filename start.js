// start.js - Prepara las variables de entorno antes de iniciar Probot

// Decodificar private key de base64 ANTES de que Probot inicie
if (process.env.PRIVATE_KEY_BASE64 && !process.env.PRIVATE_KEY) {
  console.log('🔑 Decodificando private key desde base64...');
  process.env.PRIVATE_KEY = Buffer.from(process.env.PRIVATE_KEY_BASE64, 'base64').toString('utf8');
  console.log('✅ Private key decodificada correctamente');
}

// Ahora sí, iniciar Probot
const { run } = require('probot');
const app = require('./index.js');

run(app);
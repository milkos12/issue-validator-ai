// start.js - Prepara las variables de entorno antes de iniciar Probot

// Decodificar private key de base64 ANTES de que Probot inicie
if (process.env.PRIVATE_KEY_BASE64 && !process.env.PRIVATE_KEY) {
  console.log('🔑 Decodificando private key desde base64...');
  process.env.PRIVATE_KEY = Buffer.from(process.env.PRIVATE_KEY_BASE64, 'base64').toString('utf8');
  console.log('✅ Private key decodificada correctamente');
}

// Ejecutar el comando de Probot CLI
const { execSync } = require('child_process');
const path = require('path');

const indexPath = path.join(__dirname, 'index.js');

try {
  execSync(`npx probot run ${indexPath}`, {
    stdio: 'inherit',
    env: process.env
  });
} catch (error) {
  console.error('Error al ejecutar Probot:', error);
  process.exit(1);
}
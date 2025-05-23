#!/usr/bin/env node

// Script para iniciar o servidor WebSocket para transcrição ao vivo
require('dotenv').config({ path: '.env.local' });
require('./dist/server/socket.js');

console.log('Servidor WebSocket iniciado...'); 
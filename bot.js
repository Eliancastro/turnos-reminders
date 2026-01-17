require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { MongoClient } = require('mongodb');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

let db;

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db('turnos_db');
  console.log('🤖 Bot conectado');
})();

bot.onText(/\/start/, msg => {
  bot.sendMessage(
    msg.chat.id,
    'Hola! Este bot te enviará recordatorios de turnos.'
  );
});

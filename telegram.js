const axios = require('axios');

class TelegramReporter {
    // Konstruktor menerima token dan chatId agar tidak perlu membaca file sendiri
    constructor(token, chatId) {
        this.token = token;
        this.chatId = chatId;
        this.isConfigured = this.token && this.chatId;
    }

    async sendMessage(message) {
        if (!this.isConfigured) return; // Tidak melakukan apa-apa jika token/ID tidak ada

        const url = `https://api.telegram.org/bot${this.token}/sendMessage`;
        try {
            await axios.post(url, {
                chat_id: this.chatId,
                text: message,
                parse_mode: 'HTML' // Mengizinkan format tebal, miring, dll.
            });
        } catch (error) {
            // Jika gagal, tampilkan error di console.
            console.error(`❌ Gagal mengirim pesan ke Telegram: ${error.message}`);
        }
    }
}

// Ekspor kelasnya agar bisa di-require oleh bot.js
module.exports = TelegramReporter;

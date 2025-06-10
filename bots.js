const { ethers } = require('ethers');
const axios = require('axios');
const dotenv = require('dotenv');
const TelegramReporter = require('./telegram.js'); // Impor modul Telegram kita

// Panggil konfigurasi .env di awal
dotenv.config();

// --- KUMPULAN KONFIGURASI, LOGGER, DAN UTILITAS ---
const config = {
    rpcUrl: process.env.RPC_URL,
    txCount: parseInt(process.env.TX_COUNT),
    minAmount: parseFloat(process.env.MIN_AMOUNT),
    maxAmount: parseFloat(process.env.MAX_AMOUNT),
    delay: {
        minTx: parseInt(process.env.MIN_TX_DELAY),
        maxTx: parseInt(process.env.MAX_TX_DELAY),
        minWallet: parseInt(process.env.MIN_WALLET_DELAY),
        maxWallet: parseInt(process.env.MAX_WALLET_DELAY),
    },
    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID,
    }
};

const colors = {
    cyan: "\x1b[36m", green: "\x1b[32m", yellow: "\x1b[33m",
    red: "\x1b[31m", white: "\x1b[37m", bold: "\x1b[1m", reset: "\x1b[0m"
};

const logger = {
    info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    step: (msg) => console.log(`\n${colors.white}${colors.bold}➤ ${msg}${colors.reset}`),
    tx: (msg) => console.log(`${colors.green}✔ ${msg}${colors.reset}`),
    balance: (msg) => console.log(`${colors.white}💰 ${msg}${colors.reset}`),
};

const utils = {
    delay: (min, max) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min))),
    shortenAddress: (address) => (typeof address === 'string' && address.length > 10) ? `${address.slice(0, 6)}...${address.slice(-4)}` : address,
};

// --- KELAS UTAMA BOT ---
class EVMBot {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
        this.reporter = new TelegramReporter(config.telegram.botToken, config.telegram.chatId);
        this.wallets = [];
    }

    generateRandomAmount() {
        return Math.random() * (config.maxAmount - config.minAmount) + config.minAmount;
    }

    loadPrivateKeys() {
        logger.step('Membaca Private Keys...');
        let i = 1;
        while (process.env[`PRIVATE_KEY_${i}`]) {
            try {
                const wallet = new ethers.Wallet(process.env[`PRIVATE_KEY_${i}`], this.provider);
                this.wallets.push(wallet);
                logger.info(`Memuat wallet ke-${i} (${utils.shortenAddress(wallet.address)})`);
            } catch (e) { logger.error(`Format Private Key ke-${i} tidak valid.`); }
            i++;
        }
        if (this.wallets.length === 0) throw new Error('Tidak ada Private Key valid yang ditemukan!');
    }

    async displayBalances() {
        logger.step('Mengecek Saldo Awal...');
        for (const [i, wallet] of this.wallets.entries()) {
            const balance = await this.provider.getBalance(wallet.address);
            logger.balance(`Wallet ${i + 1} (${utils.shortenAddress(wallet.address)}) | Saldo: ${parseFloat(ethers.formatEther(balance)).toFixed(5)} ETH`);
        }
    }

    async sendTransaction(wallet, walletIndex) {
        try {
            const toAddress = ethers.Wallet.createRandom().address;
            const amount = this.generateRandomAmount();
            const value = ethers.parseEther(amount.toFixed(8).toString());
            const feeData = await this.provider.getFeeData();
            const balance = await this.provider.getBalance(wallet.address);
            const gasEstimate = BigInt(21000) * (feeData.maxFeePerGas || feeData.gasPrice);

            if (balance < value + gasEstimate) {
                logger.warn(`[Wallet ${walletIndex + 1}] Saldo tidak cukup.`);
                return { success: false };
            }

            const tx = { to: toAddress, value, gasLimit: 21000, type: 2, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas };
            logger.info(`[Wallet ${walletIndex + 1}] Mengirim ${amount.toFixed(8)} ETH ke ${utils.shortenAddress(toAddress)}...`);
            
            const txResponse = await wallet.sendTransaction(tx);
            await txResponse.wait();
            
            logger.tx(`[Wallet ${walletIndex + 1}] Transaksi berhasil: ${utils.shortenAddress(txResponse.hash)}`);
            return { success: true };
        } catch (error) {
            logger.error(`[Wallet ${walletIndex + 1}] Transaksi gagal: ${error.message.slice(0, 100)}...`);
            return { success: false };
        }
    }

    async executeTransactionBatch() {
        logger.step(`Memulai Eksekusi: ${config.txCount} transaksi per wallet`);
        let totalSuccess = 0, totalFailed = 0;

        for (const [i, wallet] of this.wallets.entries()) {
            logger.step(`Memproses Wallet ${i + 1}/${this.wallets.length} (${utils.shortenAddress(wallet.address)})`);
            for (let j = 0; j < config.txCount; j++) {
                const result = await this.sendTransaction(wallet, i);
                result.success ? totalSuccess++ : totalFailed++;
                if (j < config.txCount - 1) await utils.delay(config.delay.minTx, config.delay.maxTx);
            }
            if (i < this.wallets.length - 1) await utils.delay(config.delay.minWallet, config.delay.maxWallet);
        }

        logger.step('Semua Tugas Selesai!');
        logger.success(`Total Transaksi Berhasil: ${totalSuccess}`);
        if (totalFailed > 0) logger.warn(`Total Transaksi Gagal: ${totalFailed}`);

        const summaryMessage = `✅ <b>Laporan Turnkey</b> ✅\n\n<b>Waktu:</b> ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n\n📊 <b>Hasil:</b>\n- Wallet Diproses: <code>${this.wallets.length}</code>\n- Transaksi Berhasil: <code>${totalSuccess}</code>\n- Transaksi Gagal: <code>${totalFailed}</code>`;
        await this.reporter.sendMessage(summaryMessage);
    }

    async run() {
        console.clear();
        logger.step('🚀 Bot Dimulai...');
        try {
            await this.provider.getBlockNumber();
            logger.success(`Koneksi ke RPC berhasil!`);
            this.loadPrivateKeys();
            await this.displayBalances();
            await this.executeTransactionBatch();
            
            logger.step('🏁 Bot telah menyelesaikan semua tugas.');
        } catch (error) {
            logger.error(`FATAL ERROR: ${error.message}`);
            await this.reporter.sendMessage(`❌ <b>FATAL ERROR!</b> ❌\nBot berhenti. Error:\n<code>${error.message}</code>`);
            process.exit(1);
        }
    }
}

// --- EKSEKUSI BOT ---
const bot = new EVMBot();
bot.run();

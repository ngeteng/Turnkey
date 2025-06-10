const axios = require('axios');
const { ethers } = require('ethers');
require('dotenv').config();

// Konfigurasi Logging dengan Visual Keren
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

class EVMBot {
    constructor() {
        // Membaca semua konfigurasi dari file .env
        this.config = {
            rpcUrl: process.env.RPC_URL,
            chainId: parseInt(process.env.CHAIN_ID),
            explorerUrl: process.env.EXPLORER_URL,
            txCount: parseInt(process.env.TX_COUNT),
            minAmount: parseFloat(process.env.MIN_AMOUNT),
            maxAmount: parseFloat(process.env.MAX_AMOUNT),
            minTxDelay: parseInt(process.env.MIN_TX_DELAY),
            maxTxDelay: parseInt(process.env.MAX_TX_DELAY),
            minWalletDelay: parseInt(process.env.MIN_WALLET_DELAY),
            maxWalletDelay: parseInt(process.env.MAX_WALLET_DELAY)
        };
        this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
        this.wallets = [];
    }

    // Fungsi utilitas untuk jeda acak
    delay(min, max) {
        const ms = Math.floor(Math.random() * (max - min + 1) + min);
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Fungsi utilitas untuk menghasilkan jumlah acak
    generateRandomAmount() {
        const amount = Math.random() * (this.config.maxAmount - this.config.minAmount) + this.config.minAmount;
        return parseFloat(amount.toFixed(8));
    }

    loadPrivateKeys() {
        logger.step('Membaca Private Keys dari .env...');
        let i = 1;
        while (process.env[`PRIVATE_KEY_${i}`]) {
            try {
                const pk = process.env[`PRIVATE_KEY_${i}`];
                const wallet = new ethers.Wallet(pk, this.provider);
                this.wallets.push(wallet);
                logger.info(`Menemukan dan memuat wallet ke-${i} (${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)})`);
            } catch (error) {
                logger.error(`Format Private Key ke-${i} tidak valid.`);
            }
            i++;
        }
        if (this.wallets.length === 0) {
            logger.error('Tidak ada Private Key valid yang ditemukan di .env!');
            process.exit(1);
        }
    }

    async displayBalances() {
        logger.step('Mengecek Saldo Awal Wallet...');
        for (let i = 0; i < this.wallets.length; i++) {
            const wallet = this.wallets[i];
            try {
                const balance = await this.provider.getBalance(wallet.address);
                const balanceInEth = ethers.formatEther(balance);
                logger.balance(`Wallet ${i + 1} (${wallet.address.slice(0, 6)}...) | Saldo: ${parseFloat(balanceInEth).toFixed(5)} ETH`);
            } catch (error) {
                logger.warn(`Gagal mengambil saldo untuk wallet ${i + 1}. Error: ${error.message}`);
            }
        }
    }

    async sendTransaction(wallet, walletIndex) {
        try {
            const toAddress = ethers.Wallet.createRandom().address;
            const amount = this.generateRandomAmount();
            const value = ethers.parseEther(amount.toString());
            const feeData = await this.provider.getFeeData();

            // --- Fitur Cerdas: Cek Saldo Sebelum Kirim ---
            const balance = await this.provider.getBalance(wallet.address);
            const gasEstimate = BigInt(21000) * (feeData.maxFeePerGas || feeData.gasPrice);
            if (balance < value + gasEstimate) {
                logger.warn(`Saldo tidak cukup di wallet ${walletIndex + 1} untuk mengirim ${amount} ETH + gas.`);
                return { success: false, error: 'Insufficient funds' };
            }
            // --- Akhir Fitur Cerdas ---

            const tx = {
                to: toAddress,
                value: value,
                gasLimit: 21000,
                maxFeePerGas: feeData.maxFeePerGas,
                maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                type: 2
            };

            logger.info(`[Wallet ${walletIndex + 1}] Mengirim ${amount} ETH ke ${toAddress.slice(0, 6)}...`);
            const txResponse = await wallet.sendTransaction(tx);
            const receipt = await txResponse.wait();
            
            logger.tx(`[Wallet ${walletIndex + 1}] Transaksi berhasil! Hash: ${colors.green}${txResponse.hash.slice(0, 10)}...${colors.reset}`);
            return { success: true, amount };
        } catch (error) {
            logger.error(`[Wallet ${walletIndex + 1}] Transaksi gagal: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async executeTransactionBatch() {
        logger.step(`Memulai Eksekusi: ${this.config.txCount} transaksi per wallet`);
        
        let totalSuccess = 0;
        let totalFailed = 0;

        for (let i = 0; i < this.wallets.length; i++) {
            const wallet = this.wallets[i];
            logger.step(`Memproses Wallet ${i + 1}/${this.wallets.length} (${wallet.address})`);

            for (let j = 0; j < this.config.txCount; j++) {
                const result = await this.sendTransaction(wallet, i);
                if (result.success) totalSuccess++;
                else totalFailed++;
                
                if (j < this.config.txCount - 1) {
                    await this.delay(this.config.minTxDelay, this.config.maxTxDelay);
                }
            }

            if (i < this.wallets.length - 1) {
                logger.info('Jeda antar wallet...');
                await this.delay(this.config.minWalletDelay, this.config.maxWalletDelay);
            }
        }

        logger.step('Semua Tugas Selesai!');
        logger.success(`Total Transaksi Berhasil: ${totalSuccess}`);
        if (totalFailed > 0) {
            logger.warn(`Total Transaksi Gagal: ${totalFailed}`);
        }
    }

    async run() {
        console.clear();
        logger.step('🚀 Bot Dimulai...');
        try {
            await this.provider.getBlockNumber();
            logger.success(`Koneksi ke RPC (${this.config.rpcUrl}) berhasil!`);
        } catch (error) {
            logger.error(`Koneksi ke RPC gagal: ${error.message}`);
            process.exit(1);
        }

        this.loadPrivateKeys();
        await this.displayBalances();
        await this.executeTransactionBatch();
        
        logger.step('🏁 Bot telah menyelesaikan semua tugas.');
    }
}

// Menangani error tak terduga
process.on('uncaughtException', (error) => {
    logger.error(`FATAL ERROR: ${error.message}`);
    process.exit(1);
});

// Jalankan bot
const bot = new EVMBot();
bot.run();

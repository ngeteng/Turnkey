const axios = require('axios');
const { ethers } = require('ethers');
const readline = require('readline');
require('dotenv').config();

const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  white: "\x1b[37m",
  bold: "\x1b[1m"
};

const logger = {
  info: (msg) => console.log(`${colors.green}[✓] ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}[⚠] ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}[✗] ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}[✅] ${msg}${colors.reset}`),
  loading: (msg) => console.log(`${colors.cyan}[⟳] ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.white}[➤] ${msg}${colors.reset}`),
  userInfo: (msg) => console.log(`${colors.white}[✓] ${msg}${colors.reset}`),
  banner: () => {
    console.log(`${colors.cyan}${colors.bold}`);
    console.log(`---------------------------------------------`);
    console.log(`  TurnKey Auto Bot - Airdrop Insiders  `);
    console.log(`---------------------------------------------${colors.reset}`);
    console.log();
  }
};

const getRandomUA = () => {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

const RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com';
const CHAIN_ID = 11155111; 
const EXPLORER_URL = 'https://sepolia.etherscan.io';

const network = {
  name: 'sepolia',
  chainId: CHAIN_ID,
  ensAddress: null
};

const provider = new ethers.JsonRpcProvider(RPC_URL, network);

class ETHSepoliaBot {
  constructor() {
    this.privateKeys = [];
    this.wallets = [];
    this.txCount = 0;
    this.config = {};
    this.minAmount = 0.000001;
    this.maxAmount = 0.0000022;
  }

  generateRandomAmount() {
    const randomAmount = Math.random() * (this.maxAmount - this.minAmount) + this.minAmount;
    return parseFloat(randomAmount.toFixed(8)); 
  }

  loadPrivateKeys() {
    logger.loading('Loading private keys from environment...');
    
    let keyIndex = 1;
    while (true) {
      const key = process.env[`PRIVATE_KEY_${keyIndex}`];
      if (!key) break;
      
      try {
        const wallet = new ethers.Wallet(key, provider);
        this.privateKeys.push(key);
        this.wallets.push(wallet);
        keyIndex++;
      } catch (error) {
        logger.error(`Invalid private key format for PRIVATE_KEY_${keyIndex}`);
        keyIndex++;
      }
    }

    if (this.privateKeys.length === 0) {
      logger.error('No valid private keys found in environment variables!');
      process.exit(1);
    }

    logger.success(`Loaded ${this.privateKeys.length} private keys`);
  }

  async displayUserInfo() {
    logger.step('Fetching wallet information...');
    logger.info(`Network: Sepolia Testnet (Chain ID: ${CHAIN_ID})`);
    logger.info(`RPC: ${RPC_URL}`);
    logger.info(`Explorer: ${EXPLORER_URL}`);
    logger.info(`Random Amount Range: ${this.minAmount} - ${this.maxAmount} ETH`);
    console.log();
    
    for (let i = 0; i < this.wallets.length; i++) {
      const wallet = this.wallets[i];
      try {
        const balance = await provider.getBalance(wallet.address);
        const balanceInEth = ethers.formatEther(balance);
        
        logger.userInfo(`Wallet ${i + 1}:`);
        logger.userInfo(`  Address: ${wallet.address}`);
        logger.userInfo(`  Balance: ${balanceInEth} ETH`);
        logger.userInfo(`  Explorer: ${EXPLORER_URL}/address/${wallet.address}`);
        console.log();
      } catch (error) {
        logger.error(`Failed to fetch balance for wallet ${i + 1}: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
          const balance = await provider.getBalance(wallet.address);
          const balanceInEth = ethers.formatEther(balance);
          logger.userInfo(`Wallet ${i + 1} (retry):`);
          logger.userInfo(`  Address: ${wallet.address}`);
          logger.userInfo(`  Balance: ${balanceInEth} ETH`);
          console.log();
        } catch (retryError) {
          logger.error(`Retry failed for wallet ${i + 1}: ${retryError.message}`);
        }
      }
    }
  }

  generateRandomAddress() {
    return ethers.Wallet.createRandom().address;
  }

  async getUserInput() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(`${colors.yellow}Enter number of transactions per wallet: ${colors.reset}`, (txCount) => {
        rl.close();
        resolve({
          txCount: parseInt(txCount)
        });
      });
    });
  }

  async sendTransaction(wallet, toAddress) {
    try {
      const randomAmount = this.generateRandomAmount();
      const nonce = await provider.getTransactionCount(wallet.address);
      const feeData = await provider.getFeeData();
      
      const tx = {
        to: toAddress,
        value: ethers.parseEther(randomAmount.toString()),
        gasLimit: 21000,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        nonce: nonce,
        chainId: CHAIN_ID,
        type: 2 
      };

      logger.loading(`Sending ${randomAmount} ETH from ${wallet.address} to ${toAddress}...`);
      
      const txResponse = await wallet.sendTransaction(tx);
      logger.success(`Transaction sent! Hash: ${txResponse.hash}`);
      logger.info(`Amount: ${randomAmount} ETH`);
      logger.info(`Explorer: ${EXPLORER_URL}/tx/${txResponse.hash}`);

      const receipt = await txResponse.wait();
      logger.success(`Transaction confirmed in block ${receipt.blockNumber}`);
      
      return { success: true, hash: txResponse.hash, amount: randomAmount };
    } catch (error) {
      logger.error(`Transaction failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async executeDailyTransactions() {
    logger.step(`Starting daily transaction batch...`);
    logger.info(`Amount range: ${this.minAmount} - ${this.maxAmount} ETH (random)`);
    logger.info(`Transactions per wallet: ${this.config.txCount}`);
    logger.info(`Total wallets: ${this.wallets.length}`);
    console.log();

    let totalSuccess = 0;
    let totalFailed = 0;
    let totalAmountSent = 0;

    for (let i = 0; i < this.wallets.length; i++) {
      const wallet = this.wallets[i];
      logger.step(`Processing wallet ${i + 1}/${this.wallets.length} (${wallet.address})`);

      for (let j = 0; j < this.config.txCount; j++) {
        const randomAddress = this.generateRandomAddress();
        const result = await this.sendTransaction(wallet, randomAddress);
        
        if (result.success) {
          totalSuccess++;
          totalAmountSent += result.amount;
        } else {
          totalFailed++;
        }

        const delay = Math.random() * 2000 + 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      if (i < this.wallets.length - 1) {
        const walletDelay = Math.random() * 2000 + 3000;
        await new Promise(resolve => setTimeout(resolve, walletDelay));
      }
    }

    logger.success(`Daily batch completed!`);
    logger.info(`Successful transactions: ${totalSuccess}`);
    logger.info(`Failed transactions: ${totalFailed}`);
    logger.info(`Total amount sent: ${totalAmountSent.toFixed(8)} ETH`);
    console.log();
  }

  async countdown(hours = 24) {
    const totalSeconds = hours * 60 * 60;
    
    for (let i = totalSeconds; i > 0; i--) {
      const hours = Math.floor(i / 3600);
      const minutes = Math.floor((i % 3600) / 60);
      const seconds = i % 60;
      
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      process.stdout.write(`\r${colors.cyan}[⏰] Next execution in: ${timeString}${colors.reset}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log();
    logger.success('Time\'s up! Starting next batch...');
  }

  async run() {
    logger.banner();

    logger.loading('Testing RPC connection...');
    try {
      const blockNumber = await provider.getBlockNumber();
      logger.success(`Connected to Sepolia! Latest block: ${blockNumber}`);
    } catch (error) {
      logger.error(`RPC connection failed: ${error.message}`);
      logger.error('Please check your internet connection and try again.');
      process.exit(1);
    }

    this.loadPrivateKeys();

    await this.displayUserInfo();

    const userConfig = await this.getUserInput();
    this.config = userConfig;
    
    logger.success(`Configuration saved:`);
    logger.info(`Amount range: ${this.minAmount} - ${this.maxAmount} ETH (random)`);
    logger.info(`Transactions per wallet: ${this.config.txCount}`);
    console.log();

    while (true) {
      try {
        await this.executeDailyTransactions();
        await this.countdown(24); 
      } catch (error) {
        logger.error(`Error in main loop: ${error.message}`);
        logger.warn('Retrying in 5 minutes...');
        await new Promise(resolve => setTimeout(resolve, 300000)); 
      }
    }
  }
}

process.on('SIGINT', () => {
  console.log();
  logger.warn('Bot stopped by user');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

const bot = new ETHSepoliaBot();
bot.run().catch(error => {
  logger.error(`Bot failed to start: ${error.message}`);
  process.exit(1);
});
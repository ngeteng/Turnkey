# TurnKey Auto Bot - Airdrop Insiders

Automated bot for executing transactions on Ethereum Sepolia testnet with multiple wallets. This bot helps automate daily transaction batches for airdrop farming and testnet interaction.

## Features

- **Automated Daily Transactions**: Execute transactions every 24 hours
- **Random Amount Generation**: Sends random amounts between configurable ranges
- **Multi-Wallet Support**: Handle multiple wallets simultaneously
- **Sepolia Testnet**: Safe testing environment
- **Real-time Monitoring**: Live transaction status and wallet balances
- **Countdown Timer**: Visual countdown to next execution

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Ethereum Sepolia testnet ETH for gas fees
- Private keys for your wallets

## Installation

1. Clone the repository:
```bash
git clone https://github.com/vikitoshi/Turnkey-Auto-Bot.git
cd Turnkey-Auto-Bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
nano .env
```

4. Configure your environment variables in `.env`:
```env
PRIVATE_KEY_1=your_first_private_key_here
PRIVATE_KEY_2=your_second_private_key_here
PRIVATE_KEY_3=your_third_private_key_here
# Add more private keys as needed (PRIVATE_KEY_4, PRIVATE_KEY_5, etc.)
```

## Usage

1. Start the bot:
```bash
npm start
```

2. The bot will:
   - Display all wallet information and balances
   - Ask for the number of transactions per wallet
   - Execute the configured transactions
   - Wait 24 hours before the next batch

## Configuration

### Environment Variables

- `PRIVATE_KEY_1`, `PRIVATE_KEY_2`, etc.: Your wallet private keys
- The bot automatically detects all private keys following the `PRIVATE_KEY_X` pattern

## Getting Sepolia ETH

To use this bot, you'll need Sepolia ETH for gas fees. You can get free Sepolia ETH from:

- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)

## Safety & Security

⚠️ **Important Security Notes:**

- Never share your private keys
- Only use testnet funds
- Keep your `.env` file secure and never commit it to version control
- This bot is for educational and testing purposes only

## Troubleshooting

### Common Issues

1. **"No valid private keys found"**
   - Check your `.env` file format
   - Ensure private keys are valid hex strings
   - Make sure private keys start with `0x` or are 64 characters long

2. **"RPC connection failed"**
   - Check your internet connection
   - The RPC endpoint might be down, try again later

3. **"Transaction failed"**
   - Insufficient balance for gas fees
   - Network congestion
   - Invalid transaction parameters

### Logs

The bot provides detailed colored logs:
- ✅ Green: Success messages
- ⚠️ Yellow: Warnings
- ❌ Red: Errors
- ℹ️ Cyan: Information
- ➤ White: Process steps

## File Structure

```
Turnkey-Auto-Bot/
├── index.js          # Main bot code
├── package.json       # Dependencies and scripts
├── README.md         # This file
├── .env.example      # Environment template
├── .env              # Your environment variables (create this)
└── .gitignore        # Git ignore rules
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This software is provided for educational and testing purposes only. Users are responsible for complying with all applicable laws and regulations. The authors are not responsible for any misuse of this software or any damages that may occur from its use.

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/vikitoshi/Turnkey-Auto-Bot/issues) section
2. Create a new issue if your problem isn't already reported
3. Provide detailed information about your environment and the error

## Changelog

### v1.0.0
- Initial release
- Multi-wallet support
- Automated daily transactions
- Sepolia testnet integration
- Colorful logging system
- Random amount generation

---

⭐ **Star this repository if you find it helpful!**
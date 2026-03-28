# Aether

> **Sovereign, Zero-Server, P2P Mesh Messenger.**
> Built for the era of decentralization. No clouds, no corporations, just nodes.

---

## 🛠 Project Essence
**Aether** is a desktop messenger designed on the **Local-first** principle. There is no central server, no cloud database, and no middleman. Your identity is your private key. Your network is your peers.

### ⚡ Key Pillars
* **Self-Sovereign Identity:** Identity is based on Ethereum-grade cryptography (SECP256K1). No logins, passwords, or emails required.
* **P2P Discovery:** Automatic node discovery within local networks via mDNS (powered by libp2p).
* **Strict IPC Security:** Cryptographic keys never leave the Main Process. The Frontend is a secure "mirror" with zero access to secrets.
* **Hacker Glassmorphism UI:** A futuristic dark terminal interface built with Tailwind CSS and advanced backdrop-blur effects.

---

## 🚀 Technical Stack
* **Runtime:** [Electron](https://www.electronjs.org/)
* **Frontend:** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Networking:** [libp2p](https://libp2p.io/) (TCP, WebSockets, mDNS)
* **Cryptography:** [ethers.js](https://docs.ethers.org/v6/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)

---

## 📂 Project Structure
```text
src/
├── main/           # Core Logic (Cryptography, P2P Node, IPC Handlers)
├── preload/        # Secure Bridge (Strict IPC definitions)
├── renderer/       # UI Layer (React, Hacker Theme)
└── types/          # Shared Type Definitions
🛠 Development & Setup
Prerequisites
Node.js (v18+)

npm / pnpm

Installation
Clone the repository:

Bash
git clone [https://github.com/Lastagenta/aether.git](https://github.com/Lastagenta/aether.git)
Install dependencies:

Bash
npm install
Run in Development mode:

Bash
npm run dev
📜 Roadmap (Alpha 0.1)
[x] Identity: Generation of SECP256K1 keys and secure local storage.

[x] Network: Initial libp2p node setup and mDNS peer discovery.

[x] UI: Terminal-style layout and "Hacker Glassmorphism" theme.

[ ] Messaging: Direct P2P stream implementation (In Progress).

[ ] Security: Password-protected identity storage (AES-256 encryption).

[ ] File Sharing: Direct node-to-node file transfers over streams.

⚠️ Disclaimer
EXPERIMENTAL PRE-ALPHA. This software is under active development. Do not use it for sensitive data. All messages are currently transmitted "as is" for protocol testing purposes.

📄 License
Distributed under the MIT License. See LICENSE for more information.

Built with 💚 by Lastagenta

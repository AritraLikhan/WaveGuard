# WaveGuard — Flood Monitoring & Rescue System

WaveGuard is a flood monitoring and rescue coordination system with:
- Backend: Python 3.10
- Frontend: React (Leaflet-based maps)
- Database: MongoDB

This guide helps you clone, set up, and run the project locally.

## Prerequisites
- Windows 10/11 (commands below are Windows-focused)
- Python 3.10.0 (added to PATH)
- Node.js and npm
- Git
- MongoDB installed and running (MongoDB Compass recommended)

## 1) Clone the repository
```bash
git clone https://github.com/AritraLikhan/WaveGuard.git
cd WaveGuard
```

## 2) Backend environment (myenv)
Download the pre-built Python virtual environment and place it in the project root:
- Download myenv.zip: https://mega.nz/file/eBcl3DTD#4dLU3kayO81PINeEkDanAdOPzUAh5iHFcU0fAUi9q4w
- Extract the zip and ensure the folder is named myenv and sits at the root of WaveGuard:
  WaveGuard/
    myenv/
    app2.py
    client/
    package.json
    ...

Note: The bundled venv is Windows-oriented.

## 3) Install dependencies

- In the root (WaveGuard):
```bash
npm install
```

- In the client folder:
```bash
cd client
npm install
npm install react-leaflet@4.x.x
cd ..
```

## 4) Run the app

Open two terminals.

- Terminal A (Backend — from WaveGuard root):
  - Activate the virtual environment
    - Command Prompt:
      ```bat
      myenv\Scripts\activate
      ```
    - PowerShell:
      ```powershell
      .\myenv\Scripts\Activate.ps1
      ```
    - Git Bash:
      ```bash
      myenv/Scripts/activate
      ```
  - Start the backend:
    ```bash
    python app2.py
    ```

- Terminal B (Dev server — from WaveGuard root):
  ```bash
  npm run dev
  ```

## 5) Ensure MongoDB is running
- Start MongoDB locally and open MongoDB Compass.
- Confirm your database is up and the app’s DB connection string points to the running instance.

## Troubleshooting: Port already in use (Windows)
If a port is blocked, find the process and kill it.

- Replace <port-number> with the port you need (example uses 8081).

Find the PID:
```bat
netstat -ano | findstr :<port-number>
```

Example:
```bat
netstat -ano | findstr :8081
```

You’ll see something like:
```
TCP    0.0.0.0:8081   0.0.0.0:0   LISTENING   3364
```

Kill the process by PID:
```bat
taskkill /PID 3364 /F
```

CAUTION: If the port may be used by a critical process, prefer changing the frontend/backend port instead of killing the process.

## Notes
- Make sure Python 3.10.0 is installed and added to your PATH (globally accessible).
- Keep Terminal A (backend) and Terminal B (dev) running at the same time.
- If you run into permission issues activating the venv in PowerShell, you may need to set the execution policy:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
  ```
- If you’re not on Windows, you’ll need to create your own virtual environment and install dependencies accordingly.

// File: src/App.jsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const App = () => {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const fetchDevices = async () => {
      const response = await fetch("/api/devices");
      const data = await response.json();
      setDevices(data);
    };
    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {devices.map((device, index) => (
        <Card key={index} className="shadow-lg">
          <CardContent>
            <h2 className="text-xl font-bold">MAC: {device.mac}</h2>
            <p>Last Seen: {new Date(device.last_seen * 1000).toLocaleString()}</p>
            <Badge variant="outline" className="mt-2">Active</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default App;

// File: Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

// File: beacon_calibration.py
import time, math
from bluepy.btle import Scanner

print("Calibrating RSSI values...")
scanner = Scanner()

beacon_mac = input("Enter target beacon MAC: ")
readings = []
print("Collecting RSSI... (10 sec)")

start_time = time.time()
while time.time() - start_time < 10:
    devices = scanner.scan(1.0)
    for dev in devices:
        if dev.addr.lower() == beacon_mac.lower():
            readings.append(dev.rssi)
            print(f"RSSI: {dev.rssi} dBm")

if readings:
    avg_rssi = sum(readings) / len(readings)
    print(f"\nCalibrated RSSI: {avg_rssi:.2f} dBm")
else:
    print("No readings found for given MAC.")

// File: api/server.py
from flask import Flask, jsonify
import sqlite3
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/api/devices")
def get_devices():
    conn = sqlite3.connect("devices.db")
    cursor = conn.cursor()
    cursor.execute("SELECT mac, MAX(timestamp) FROM device_log GROUP BY mac")
    rows = cursor.fetchall()
    return jsonify([{"mac": r[0], "last_seen": r[1]} for r in rows])

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

// File: cloud_sync.py
import boto3
import os

s3 = boto3.client('s3')

BUCKET_NAME = "your-bucket-name"

# Sync local logs folder to S3
for filename in os.listdir("logs"):
    filepath = os.path.join("logs", filename)
    if os.path.isfile(filepath):
        s3.upload_file(filepath, BUCKET_NAME, f"device_logs/{filename}")
        print(f"Uploaded {filename} to S3")

// File: db_init.py
import sqlite3

conn = sqlite3.connect("devices.db")
cursor = conn.cursor()

cursor.execute('''
CREATE TABLE IF NOT EXISTS device_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mac TEXT,
    rssi INTEGER,
    timestamp REAL
)
''')

cursor.execute("INSERT INTO device_log (mac, rssi, timestamp) VALUES (?, ?, ?)",
               ("AA:BB:CC:DD:EE:FF", -45, 1716400000))
conn.commit()
conn.close()
print("Initialized devices.db with seed data.")

// File: docker-compose.yml
version: '3'
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - backend

  backend:
    image: python:3.10
    volumes:
      - ./api:/app
    working_dir: /app
    command: bash -c "pip install flask flask-cors && python server.py"
    ports:
      - "5000:5000"
    depends_on:
      - db

  db:
    image: nouchka/sqlite3
    volumes:
      - ./devices.db:/root/devices.db

// File: ring-integration.js
const { RingApi } = require('ring-client-api');
const fs = require('fs');
require('dotenv').config();

const ringApi = new RingApi({
  refreshToken: process.env.RING_REFRESH_TOKEN,
  debug: true,
});

(async () => {
  const locations = await ringApi.getLocations();

  for (const location of locations) {
    const cameras = await location.cameras;

    for (const camera of cameras) {
      console.log(`Connected to: ${camera.name}`);

      camera.onNewNotification.subscribe((notification) => {
        console.log('New Ring Event:', notification);
      });

      const snapshot = await camera.getSnapshot();
      fs.writeFileSync(`snapshot-${camera.name}.jpg`, snapshot);
      console.log(`Snapshot saved for ${camera.name}`);
    }
  }
})();

// File: .env (DO NOT COMMIT)
RING_REFRESH_TOKEN=your-ring-refresh-token-goes-here

// File: README.md
# Smart Home Security Platform

This platform uses Raspberry Pi, wireless beacons, Ring cameras, and AI to detect and alert you to the presence of known/unknown devices and people.

## Features
- BLE/Wi-Fi device detection with Wireshark
- Real-time dashboard (React)
- Flask backend API with SQLite
- Cloud sync to AWS S3
- Ring camera integration (motion detection, snapshots)
- Beacon calibration and signal analysis

## Getting Started

```bash
# Setup backend database
python db_init.py

# Run all services
docker-compose up --build

# To test Ring camera integration
node ring-integration.js
```

## API
- `GET /api/devices` – List devices with last seen timestamps.

## Notes
- Create a `.env` file and paste your `RING_REFRESH_TOKEN` securely.
- Never commit `.env` to source control.

## License
MIT

import { BleManager } from 'react-native-ble-plx';
import BLEAdvertiser from 'react-native-ble-advertiser';
import { PermissionsAndroid, Platform, NativeModules } from 'react-native';

let isAdvertising = false;

const SERVICE_UUID = '0000ABCD-0000-1000-8000-00805F9B34FB'; // Replace with your UUID
const COMPANY_ID = 0x1234; // Replace with your company ID

const manager = new BleManager();

// 🔹 Request all Bluetooth permissions (for Android 12+)
const requestBluetoothPermissions = async () => {
  if (Platform.OS === 'android') {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, // Needed for BLE scanning
    ];

    const granted = await PermissionsAndroid.requestMultiple(permissions);

    return (
      granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
      granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE] === PermissionsAndroid.RESULTS.GRANTED &&
      granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED &&
      granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED
    );
  }
  return true;
};

const isBluetoothEnabled = async () => {
  try {
    const permissionGranted = await requestBluetoothPermissions();
    if (!permissionGranted) {
      console.log('❌ Bluetooth permissions denied');
      return false;
    }

    const state = await manager.state();
    console.log('Bluetooth State:', state);

    return state === 'PoweredOn';
  } catch (error) {
    console.error('Error checking Bluetooth state:', error);
    return false;
  }
};

// Start BLE Advertising
const startBluetoothAdvertising = async (sessionData) => {
  try {
    if (isAdvertising) {
      console.log('Already broadcasting!');
      return true;
    }

    const { courseBatchName, teacher, classSize } = sessionData;

    // Prepare the broadcast message
    const broadcastMessage = `${courseBatchName}:${teacher}:${classSize}`;
    console.log('BLE Advertising Message:', broadcastMessage);

    // Convert the message to a byte array
    const encodedData = broadcastMessage.split('').map((c) => c.charCodeAt(0));

    // Set the company ID (optional, but recommended for custom data)
    BLEAdvertiser.setCompanyId(COMPANY_ID);

    // Start advertising
    await BLEAdvertiser.broadcast(SERVICE_UUID, encodedData, {})
      .then(() => {
        console.log('✅ BLE Broadcasting Started Successfully');
        isAdvertising = true;
      })
      .catch((error) => {
        console.error('❌ BLE Broadcasting Error:', error);
      });

    // Stop advertising after seconds (optional)
    setTimeout(stopBluetoothAdvertising, 60000);

    return true;
  } catch (error) {
    console.error('Error starting Bluetooth advertising:', error);
    return false;
  }
};

// Stop BLE Advertising
const stopBluetoothAdvertising = async () => {
  try {
    if (!isAdvertising) {
      console.log('❗ BLE is not currently broadcasting.');
      return;
    }

    console.log('Stopping BLE Advertising...');
    await BLEAdvertiser.stopBroadcast()
      .then(() => {
        console.log('✅ BLE Broadcasting Stopped');
        isAdvertising = false;
      })
      .catch((error) => {
        console.error('❌ Error Stopping BLE Broadcast:', error);
      });
  } catch (error) {
    console.error('Error stopping Bluetooth advertising:', error);
  }
};


const startBluetoothScanning = async () => {
  console.log('scanning started');
  manager.startDeviceScan(null, null, (error, device) => {
    if (error) {
      console.error('Scan error:', error);
      return;
    }
    // Check for manufacturer data
    if (device?.manufacturerData) {
      const rawData = device.manufacturerData;
      const decodedData = String.fromCharCode(...rawData); // Decode byte array to string
      const newDevice = {
        id: device.id,
        name: device.name || 'Unknown',
        rssi: device.rssi,
        data: decodedData,
      };
      console.log(newDevice);
    }
  });
};


// Stop Bluetooth Scanning
const stopBluetoothScanning = async (listener) => {
  manager.stopDeviceScan();
  console.log('Scanning stopped');
};

export { isBluetoothEnabled, startBluetoothAdvertising, stopBluetoothAdvertising, startBluetoothScanning, stopBluetoothScanning };

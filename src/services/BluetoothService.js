import { BleManager } from 'react-native-ble-plx';
import BLEAdvertiser from 'react-native-ble-advertiser';
import { PermissionsAndroid, Platform } from 'react-native';
import {Buffer} from 'buffer';

let isAdvertising = false;

const SERVICE_UUID = '0000ABCD-0000-1000-8000-00805F9B34FB';

const manager = new BleManager();

const requestBluetoothPermissions = async () => {
  if (Platform.OS === 'android') {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
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

const startBluetoothAdvertising = async (classData) => {
  try {
    if (isAdvertising) {
      console.log('Already broadcasting!');
      return true;
    }

    const { course, batch, teacher, classSize } = classData;

    const broadcastMessage = `${course}|${batch}|${teacher}|${classSize}`;
    const encodedData = customEncode(broadcastMessage);

    console.log('broadcast message:', broadcastMessage);
    console.log('encoded data', encodedData);

    BLEAdvertiser.setCompanyId(0x0001);

    await BLEAdvertiser.broadcast(SERVICE_UUID, encodedData, {})
      .then(() => {
        console.log('✅ BLE Broadcasting Started Successfully');
        isAdvertising = true;
      })
      .catch((error) => {
        console.error('❌ BLE Broadcasting Error:', error);
      });

    return true;
  } catch (error) {
    console.error('Error starting Bluetooth advertising:', error);
    return false;
  }
};

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

const startBluetoothScanning = async (onDeviceFound) => {
  console.log('Scanning started');

  manager.startDeviceScan(null, null, (error, device) => {
    if (error) {
      console.error('Scan error:', error);
      return;
    }

    if(device?.serviceUUIDs?.includes(SERVICE_UUID.toLowerCase())) {
      console.log(device);
      const encodedData = device.manufacturerData;
      if (!encodedData) {return;}
      const decodedData = customDecode(encodedData);
      console.log(decodedData);
      const [course, batch, teacher, classSize] = decodedData.split('|');
      const classData = { course, batch, teacher, classSize, rssi: device.rssi };
      console.log('Decoded Message : ' ,classData);
      onDeviceFound(classData);
      manager.stopDeviceScan();
    }
  });
};

const stopBluetoothScanning = async () => {
  manager.stopDeviceScan();
  console.log('Scanning stopped');
};

const customEncode = (str) => {
  return Array.from(str).map(char => char.charCodeAt(0));
};

const customDecode = (encodedStr) => {
  const base64String = Buffer.from(encodedStr, 'base64').toString('utf-8'); // Decode Base64
  return base64String.replace(/^\u0001\u0000/, '');
};

export {
  isBluetoothEnabled,
  startBluetoothAdvertising,
  stopBluetoothAdvertising,
  startBluetoothScanning,
  stopBluetoothScanning,
};

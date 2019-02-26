# React Native Giiker

React Native Bluetooth package to connect to Xiaomi Giiker Cube. Tested in android only, but probably works on ios too.

## Getting Started
This package depends on the React Native BLE Library ([react-native-ble-plx](https://github.com/Polidea/react-native-ble-plx)) that provides interface to scan, read/write data to devices, monitor characteristics and more.

All features in this package were based on other Giiker related projects around the github. Many thanks to the contributors, specially the ones below:
- giiker <[hakatashi/giiker](https://github.com/hakatashi/giiker)> and <[Scarygami/giiker](https://github.com/Scarygami/giiker)> 
- SuperCube-API <[Vexu/SuperCube-API](https://github.com/Vexu/SuperCube-API)> 

 

[![npm version](https://img.shields.io/npm/v/react-native-giiker.svg?style=flat-square)](https://www.npmjs.com/package/react-native-giiker)

- [Installation](#installation)
- [Usage](#usage)
- [Examples](#examples)
- [Props](#props)
- [Demo](#demo)
- [Credits](#credits)

### Installation
First, read React Native BLE Library ([react-native-ble-plx](https://github.com/Polidea/react-native-ble-plx)) installation guide, then run one of these commands:

`npm install --save react-native-giiker`  
or  
`yarn add react-native-giiker`

### Usage
```javascript
import React, { Component } from 'react';
import { View, Text, StyleSheet, PermissionsAndroid } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import Giiker from 'react-native-giiker';

export default class Application extends Component {
  state = {
    bluetoothState: "Unknown",
    giikerState: "Disconnected"
  }

  constructor(props) {
    super();
    this.manager = new BleManager();
    this.checkBlePermission();
  }

  componentWillMount() {
    // Monitor bluetooth state change
    this.manager.onStateChange((state) => {
      this.setState({ bluetoothState: state });

      if (state == "PoweredOn") {
        this.scanAndConnect();
      }
    }, true);
  }

  async checkBlePermission() {
    const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);
    if (!granted)
      await this.requestBlePermission();
  }

  async requestBlePermission() {
    try {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION)
    } catch (err) {
      console.warn(err)
    }
  }

  scanAndConnect() {
    this.setState({ giikerState: "Searching..." });

    this.manager.startDeviceScan(null, null, async (error, device) => {
      // Handle error (scanning will be stopped automatically)
      if (error)
        return;
        
      if (device.name != null) {
        // Connect to first device found
        if (device.name.match("^(GiC|GiS)")) {
          console.log(device);
          this.setState({ giikerState: "Connecting..." });

          this.manager.stopDeviceScan();
          this.giiker = new Giiker(device);

          await this.giiker.connect();

          // Events
          this.giiker.on("connected", () => {
            this.setState({ giikerState: "Connected" });

            this.giiker.getBatteryLevel(false);
            this.giiker.getMoveCount(false);
          });
          this.giiker.on("disconnected", () => {
            this.setState({ giikerState: "Disconnected" });
          });
          this.giiker.on("move", (move) => {
            console.log(move);
          });
          this.giiker.on("battery", (battery) => {
            console.log(battery);
          });
          this.giiker.on("move count", (count) => {
            console.log(count);
          });
          this.giiker.on("update state", () => {
            console.log(this.giiker.stateString);
          });
        }
      }

    });
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={{ fontSize: 20 }}>React Native Giiker</Text>
        <Text>Bluetooth State: {this.state.bluetoothState}</Text>
        <Text>Giiker State: {this.state.giikerState}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  }
});
```
In Progress...

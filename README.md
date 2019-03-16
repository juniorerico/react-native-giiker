# React Native Giiker

<img width="220px" align="right" src="https://github.com/juniorerico/react-native-giiker/blob/master/example.gif" />

React Native Bluetooth package to connect to Xiaomi Giiker Cube. Tested in android only, but probably works on ios too.

## Getting Started
This package depends on the React Native BLE Library ([react-native-ble-plx](https://github.com/Polidea/react-native-ble-plx)) that provides interface to scan, read/write data to devices, monitor characteristics and more.
 

[![npm version](https://img.shields.io/npm/v/react-native-giiker.svg?style=flat-square)](https://www.npmjs.com/package/react-native-giiker)

- [Installation](#installation)
- [Usage](#usage)
- [Giiker Events](#giiker-events)
- [Demo](#demo)
- [Credits](#credits)


### Installation
First, read React Native BLE Library ([react-native-ble-plx](https://github.com/Polidea/react-native-ble-plx)) installation guide, then run one of these commands:

`npm install --save react-native-giiker`  
or  
`yarn add react-native-giiker`

### Usage

First, we need to import BleManager from 'react-native-ble-plx' and Giiker from 'react-native-giiker':

```javascript
import { BleManager } from 'react-native-ble-plx';
import Giiker from 'react-native-giiker';
````

Then, we have to initialize BleManager and check if the app has Bluetooth Low Energy permission. We can do that in the component/class constructor using the code below, provided by React Native BLE Library ([react-native-ble-plx](https://github.com/Polidea/react-native-ble-plx)):

```javascript
export default class Application extends Component {

  constructor(props) {
    super();

    this.manager = new BleManager();
    this.checkBlePermission();
  }

  componentWillMount() {
    // Monitor bluetooth state change
    this.manager.onStateChange((state) => {
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
```

Now the app has BLE permission, we are able to scan and connect to Giiker device: 

```javascript
scanAndConnect() {
    this.manager.startDeviceScan(null, null, async (error, device) => {
        // Handle error (scanning will be stopped automatically)
        if (error)
            return;

        if (device.name != null) {
            // Connect to first device found
            if (device.name.match("^(GiC|GiS)")) {
                this.manager.stopDeviceScan();
                this.giiker = new Giiker(device);

                await this.giiker.connect();

                // Events
                this.giiker.on("connected", () => {
                    this.giiker.getBatteryLevel(false);
                    this.giiker.getMoveCount(false);
                });
                this.giiker.on("disconnected", () => {
                    console.log("Giiker disconnected!");
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
```  

### Giiker Events
Giiker object uses events to notify listeners about the cube state, moves and battery. Check the events below and how they work:

- **connected**  
This event is triggered just after Giiker beein properly connected.

```javascript
this.giiker.on("connected", () => {
    console.log("Giiker has connected!");
});
```

- **disconnected**  
This event is triggered just after Giiker disconnect.

```javascript
this.giiker.on("disconnected", () => {
    console.log("Giiker disconnected!");
});
```

- **move**  
This event is triggered when you turn the cube. The move object is returned containing:   
**face**: (U, F, L, R, D or B)  
**amount**: (1, -1, 2, or -2) and  
**notation**: U2, F and R2, for example.


```javascript
this.giiker.on("move", (move) => {
    console.log(move);
});
```

- **battery**  
This event is triggered to inform the battery and charging states. In order to receive this event, first you need to call the **getBatteryLevel** function. This function receives a boolean to indicate if you want to continue monitoring or not:  
```javascript
// Check battery/charging state just once and stop monitoring it.
this.giiker.getBatteryLevel(true);

// Check battery/charging state updates 'forever'
this.giiker.getBatteryLevel(false);

// Call this function if you want to stop monitoring the battery/charging state
this.giiker.stopBatteryMonitor();
```

```javascript
this.giiker.on("battery", (battery) => {
    console.log(battery.batteryLevel);
    console.log(battery.chargingState);
});
```

- **move count**  
This event is triggered to inform the the amount of turns was made on the cube. In order to receive this event, first you need to call the **getMoveCount** function. This function receives a boolean to indicate if you want to continue monitoring or not:  
```javascript
// Check move count just once and stop monitoring it.
this.giiker.getMoveCount(true);

// Check move count updates 'forever'
this.giiker.getMoveCount(false);

// Call this function if you want to stop monitoring the move count updates.
this.giiker.stopMoveCountMonitor();
```

```javascript
this.giiker.on("move count", (count) => {
    console.log(count);
});
```

**Note**: This event is not triggered after every turn on the cube. You need to call the **getMoveCount** function if you want to get move counts instantly.

- **update state**  
This event is triggered after request Giiker to reset it internal state.

```javascript
this.giiker.on("update state", () => {
    console.log(this.giiker.stateString);
});
```

### Demo
* `git clone https://github.com/juniorerico/react-native-giiker`
* `cd react-native-giiker/examples/RNGiikerDemo`
* `yarn install`
* **Android**
	* Run android simulator / plug in your android device
	* Run `react-native run-android` in terminal

## Credits

All features in this package were adapted and inspired from other Giiker related projects around the github. Many thanks to the creators/contributors, specially the ones below:
* giiker <[hakatashi/giiker](https://github.com/hakatashi/giiker)> and <[Scarygami/giiker](https://github.com/Scarygami/giiker)> 
* SuperCube-API <[Vexu/SuperCube-API](https://github.com/Vexu/SuperCube-API)> 

This package also uses the **base64-arraybuffer** package to converts data:
* base64-arraybuffer <[niklasvh/base64-arraybuffer](https://github.com/niklasvh/base64-arraybuffer)> 

import React, { Component } from 'react';
import {
    StyleSheet, Text,
    View, PermissionsAndroid,
    Image, Button,
    ToastAndroid, Modal,
    FlatList, TouchableHighlight,
    ActivityIndicator
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import Giiker from '../src/Giiker';

export default class App extends Component {
    state = {
        bluetoothState: "Updating...",
        devices: [],
        giikerStatus: 'Disconnected',
        giikerConnected: false,
        moves: "",
        stateString: "",
        devicesModalVisible: false
    }

    constructor(props) {
        super();
        this.manager = new BleManager();
    }

    componentWillMount() {
        this.manager.onStateChange((state) => {
            this.setState({ bluetoothState: state });
        }, true);
    }

    async checkBluetoothPermission() {
        const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);

        if (granted) {
            console.log("You can use the BLUETOOTH_ADMIN")
        }
        else {
            console.log('dont have permission');
            await this.requestBluetoothPermission();
        }
    }

    async requestBluetoothPermission() {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
            )
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                console.log("Bluetooth permission granted!");
            } else {
                console.log("Bluetooth permission denied!");
            }
        } catch (err) {
            console.warn(err)
        }
    }

    resetGiikerSolved() {
        if (this.giiker && this.giiker.isConnected()) {
            this.giiker.resetSolved();
            ToastAndroid.show('Giiker was reseted to solved state!', ToastAndroid.SHORT);
        } else {
            ToastAndroid.show('Giiker is not connected!', ToastAndroid.SHORT);
        }
    }

    handleConnectDisconnectButton() {
        if (this.state.isGiikerConnected) {
            this.disconnect();
        } else {
            this.setState({ devicesModalVisible: true });

            let devices = this.state.devices;

            this.manager.startDeviceScan(null, null, async (error, device) => {
                // Handle error (scanning will be stopped automatically)
                if (error) {
                    ToastAndroid.show("Ops! Error while try to scan devices. See logs for more details.");
                    console.log(error);
                    return
                }

                if (device.name != null) {
                    // Check if device's name starts with 'GiC' or 'GiS'.
                    if (device.name.match("^(GiC|GiS)")) {
                        // Insert device into devices list if not already inserted
                        if (devices.findIndex(x => x.id == device.id) === -1) {
                            devices.push(device);
                            this.setState({ devices });
                        }
                    }
                }
            });
        }
    }

    closeDevicesModal() {
        this.setState({ devicesModalVisible: false });
        this.manager.stopDeviceScan();
        this.setState({ devices: [] });
    }

    disconnect() {
        this.setState({ giikerStatus: 'Disconnecting...' });

        this.giiker.disconnect().then(() => {
            this.setState({ giikerStatus: 'Disconnected', isGiikerConnected: false });
        });

    }

    // Connect to the selected device
    async connect(device) {
        this.manager.stopDeviceScan();

        this.giiker = new Giiker(device)
        await this.giiker.connect();

        this.giiker.on("connected", () => {
            this.setState({ giikerStatus: 'Connected!', isGiikerConnected: true });
        });

        this.giiker.on("move", (move) => {
            stateString = this.giiker.stateString;
            moves = this.state.moves;
            moves += `${move.notation} `;
            this.setState({ moves, stateString });
        });
    }

    handleSelectDevice(device) {
        this.closeDevicesModal();

        this.connect(device);

        this.setState({ giikerStatus: 'Connecting...' });
    }

    render() {
        const { bluetoothState, moves, giikerStatus, stateString, devicesModalVisible } = this.state

        return (
            <View style={styles.container}>
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={devicesModalVisible}
                    onRequestClose={() => { }}
                >
                    <View style={styles.devicesModalContainer}>
                        <View style={styles.devicesModalInnerContainer}>
                            <Text style={{ fontSize: 25, marginBottom: 20 }}>
                                Bluetooth Devices
                            </Text>

                            <FlatList
                                style={{ width: '100%' }}
                                data={this.state.devices}
                                extraData={this.state}
                                keyExtractor={item => item.id}
                                renderItem={({ item }) =>
                                    <TouchableHighlight
                                        onPress={() => { this.handleSelectDevice(item) }}
                                        style={{ alignItems: 'center' }}
                                        underlayColor="#00aaff">
                                        <Text style={{ fontSize: 18 }}>{item.name}</Text>
                                    </TouchableHighlight>
                                }
                            />

                            <ActivityIndicator size="large" color="#b7b7b7" style={{ marginBottom: 20, alignSelf: 'center' }} />

                            <View style={{ width: '100%' }}>
                                <Button
                                    onPress={() => { this.closeDevicesModal() }}
                                    title="Close"
                                    color="#b7b7b7" />
                            </View>
                        </View>
                    </View>
                </Modal>

                <Text>Bluetooth State: {bluetoothState}</Text>
                <Text style={{ margin: 5 }}>Giiker State: {giikerStatus}</Text>

                <Button
                    onPress={() => { this.handleConnectDisconnectButton() }}
                    title={this.state.isGiikerConnected ? "Disconnect" : "Connect Giiker"}
                    color="#75aaff"
                />
                {/* <Button
                    onPress={() => { this.resetGiikerSolved() }}
                    title="Reset Cube"
                    color="#75aaff"
                /> */}
            </View>
        );

    }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
    },
    devicesModalContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    devicesModalInnerContainer: {
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        height: '60%'
    }
});

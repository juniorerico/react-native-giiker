import React, { Component } from 'react';
import {
    StyleSheet, Text,
    View, PermissionsAndroid,
    Button, Dimensions,
    ToastAndroid, Modal,
    FlatList, TouchableHighlight,
    ActivityIndicator, ScrollView,
    YellowBox
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import Giiker from 'react-native-giiker';

YellowBox.ignoreWarnings(["Remote debugger is in a"]);

export default class App extends Component {
    state = {
        bluetoothState: "Updating...",
        giikerStatus: 'Disconnected',
        isGiikerConnected: false,
        giikerBattery: null,
        giikerMoveCount: null,
        devices: [],
        moves: "",
        giikerState: "",
        devicesModalVisible: false
    }

    constructor(props) {
        super();

        // Initialize BLE-PLX
        this.manager = new BleManager();
    }

    componentWillMount() {
        // Monitor bluetooth state change
        this.manager.onStateChange((state) => {
            this.setState({ bluetoothState: state });
        }, true);
    }

    // Set default state variables
    resetState() {
        this.setState({
            isGiikerConnected: false,
            giikerBattery: null,
            giikerMoveCount: null,
            devices: [],
            moves: "",
            giikerState: "",
            devicesModalVisible: false
        });
    }

    // Check if app has bluetooth low energy permission
    async checkBluetoothPermission() {
        const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);

        if (granted)
            return true;
        else
            return await this.requestBluetoothPermission();
    }

    // Request BLE permission
    async requestBluetoothPermission() {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
            )
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                return true;
            } else {
                ToastAndroid.show("Bluetooth permission denied!", ToastAndroid.SHORT);
                return false;
            }
        } catch (err) {
            console.warn(err)
            return false;
        }
    }

    // Handle click on connect/disconnect button
    async handleConnectDisconnectButton() {
        if (this.state.bluetoothState != "PoweredOn") {
            ToastAndroid.show("Please, turn on your phone bluetooth.", ToastAndroid.SHORT);
            return;
        } else {
            const granted = await this.checkBluetoothPermission();
            if (!granted)
                return
        }

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
                    return;
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

    // Handle button  to close list devices modal
    closeDevicesModal() {
        this.setState({ devicesModalVisible: false });
        this.manager.stopDeviceScan();
        this.setState({ devices: [] });
    }

    // Handle disconnect button click
    disconnect() {
        this.setState({ giikerStatus: 'Disconnecting...' });

        this.giiker.disconnect().then(() => {
            this.resetState();
        });
    }

    // Connect to the selected device
    async connect(device) {
        this.manager.stopDeviceScan();

        this.giiker = new Giiker(device)
        await this.giiker.connect();

        this.giiker.on("connected", () => {
            this.setState({
                giikerStatus: 'Connected!',
                isGiikerConnected: true,
                giikerState: this.giiker.stateString
            });

            this.giiker.getBatteryLevel(false);
            this.giiker.getMoveCount(false);
        });

        this.giiker.on("disconnected", () => {
            this.setState({ giikerStatus: 'Disconnected', isGiikerConnected: false });
        });

        this.giiker.on("move", (move) => {
            this.setState({
                moves: this.state.moves += `${move.notation} `,
                giikerState: this.giiker.stateString,
                giikerMoveCount: this.state.giikerMoveCount + 1
            });
        });

        this.giiker.on("battery", (battery) => {
            const { batteryLevel, chargingState } = battery;
            this.setState({ giikerBattery: { batteryLevel, chargingState } });
        });

        this.giiker.on("move count", (count) => {
            this.setState({ giikerMoveCount: count });
        });

        this.giiker.on("update state", () => {
            this.setState({ giikerState: this.giiker.stateString });
            this.giiker.getMoveCount(false);
        });
    }

    handleSelectDevice(device) {
        this.closeDevicesModal();
        this.connect(device);
        this.setState({ giikerStatus: 'Connecting...' });
    }

    // Reset Giiker to internal solved state
    async handleResetSolved() {
        await this.giiker.resetSolved();
        this.setState({ moves: "" });

        ToastAndroid.show("Giiker was reseted to internal solved state!", ToastAndroid.SHORT);
    }

    render() {
        return (
            <View style={styles.container}>
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={this.state.devicesModalVisible}
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

                <View style={styles.infoContainer}>
                    <Text>Bluetooth State: {this.state.bluetoothState}</Text>
                    <Text>Giiker State: {this.state.giikerStatus}</Text>
                    {this.state.giikerBattery && (
                        <Text>
                            Battery: {this.state.giikerBattery.batteryLevel} ( {this.state.giikerBattery.chargingState.description} )
                        </Text>
                    )}
                    {this.state.giikerMoveCount && (
                        <Text>Move Count: {this.state.giikerMoveCount}</Text>
                    )}
                </View>

                <View style={styles.actionButtons}>
                    <Button
                        onPress={() => { this.handleConnectDisconnectButton() }}
                        title={this.state.isGiikerConnected ? "Disconnect" : "Connect Giiker"}
                        color="#75aaff"
                    />
                    {this.state.isGiikerConnected &&
                        <Button
                            onPress={() => { this.handleResetSolved() }}
                            title="Reset Solved"
                            color="#e53b3b"
                        />
                    }
                </View>

                {this.state.isGiikerConnected && (
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 20, marginBottom: 10 }}>Moves</Text>
                        <View style={styles.movesContainer}>
                            <ScrollView>
                                <Text>{this.state.moves}</Text>
                            </ScrollView>
                        </View>

                        <View style={{ margin: 10, alignItems: 'center' }}>
                            <Text style={{ fontSize: 20, marginBottom: 10 }}>Cube State</Text>
                            <Text>{this.state.giikerState}</Text>
                        </View>

                    </View>
                )}

            </View>
        );

    }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 10
    },
    devicesModalContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    devicesModalInnerContainer: {
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(216, 231, 255, 0.95)',
        height: '60%'
    },
    infoContainer: {
        width: '100%',
        alignSelf: 'flex-start',
        alignItems: 'center',
        marginBottom: 30
    },
    actionButtons: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    movesContainer: {
        marginTop: 10,
        borderWidth: 0.5,
        borderRadius: 5,
        padding: 10,
        width: Dimensions.get('window').width * 0.85,
        height: Dimensions.get('window').height * 0.15,
        alignItems: 'center'
    }
});

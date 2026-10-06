import type { UnknownAction } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';

import type { SerializableDeviceInfo } from '../../../utils/deviceUtils';
import { clearDisconnectedActiveDevice, deviceManagementReducer, setActiveDevice, setDeviceList } from './index';
import type { DeviceManagementState } from './types';

const reducer = deviceManagementReducer.deviceManagement;

const microphone = (deviceId: string, label: string): SerializableDeviceInfo => ({
    deviceId,
    groupId: `group-${deviceId}`,
    kind: 'audioinput',
    label,
});

const JABRA = microphone('jabra', 'Jabra Evolve2 30 (0b0e:0e31)');
const MACBOOK = microphone('macbook', 'MacBook Pro Microphone (Built-in)');
const AIRPODS = microphone('airpods', 'AirPods (Bluetooth)');

const listMicrophones = (devices: SerializableDeviceInfo[]) => setDeviceList({ kind: 'audioinput', devices });
const useMicrophone = (deviceId: string) => setActiveDevice({ kind: 'audioinput', deviceId });
const clearDisconnectedMicrophone = () => clearDisconnectedActiveDevice({ kind: 'audioinput' });

const withPreferredMicrophone = (preferredMicrophoneId: string): DeviceManagementState => ({
    ...reducer(undefined, { type: 'init' }),
    preferredMicrophoneId,
});

const run = (state: DeviceManagementState, ...actions: UnknownAction[]) =>
    actions.reduce((current, action) => reducer(current, action), state);

describe('deviceManagement reducer, recording the device in use that disconnected', () => {
    it('records the active device when it leaves the list', () => {
        const state = run(
            withPreferredMicrophone('jabra'),
            useMicrophone('jabra'),
            listMicrophones([MACBOOK, JABRA]),
            listMicrophones([MACBOOK])
        );

        expect(state.disconnectedActiveDevices.audioinput).toEqual(JABRA);
    });

    it('records the preferred device when recovering its dead track moved the active device before the list arrived', () => {
        const state = run(
            withPreferredMicrophone('jabra'),
            useMicrophone('jabra'),
            listMicrophones([MACBOOK, JABRA]),
            useMicrophone('macbook'),
            listMicrophones([MACBOOK])
        );

        expect(state.disconnectedActiveDevices.audioinput).toEqual(JABRA);
    });

    it('stays quiet when the preferred device came back unused and is unplugged again', () => {
        const unpluggedOnce = run(
            withPreferredMicrophone('jabra'),
            useMicrophone('jabra'),
            listMicrophones([JABRA, AIRPODS]),
            useMicrophone('airpods'),
            listMicrophones([AIRPODS])
        );

        expect(unpluggedOnce.disconnectedActiveDevices.audioinput).toEqual(JABRA);

        const unpluggedAgain = run(
            unpluggedOnce,
            clearDisconnectedMicrophone(),
            listMicrophones([JABRA, AIRPODS]),
            listMicrophones([AIRPODS])
        );

        expect(unpluggedAgain.disconnectedActiveDevices.audioinput).toBeNull();
    });
});

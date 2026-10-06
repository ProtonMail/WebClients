import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import type { DeviceKind } from '@proton/meet/store/slices/deviceManagementSlice/types';
import type { SerializableDeviceInfo } from '@proton/meet/utils/deviceUtils';

import { RECHECK_DELAY_MS } from '../useDeviceListSync';
import { isSameHardware } from './isSameHardware';

const NOTIFICATION_EXPIRATION_MS = 10000;

// The kinds of one unplug can arrive an enumerate apart, so the window has to outlast the recheck
const GROUPING_WINDOW_MS = RECHECK_DELAY_MS + 100;

const KIND_ORDER: DeviceKind[] = ['audioinput', 'audiooutput', 'videoinput'];

const getGroupKey = (groupId: string, kind: DeviceKind) => groupId || kind;

interface PendingDisconnect {
    device: SerializableDeviceInfo;
    replacementLabel: string;
}

const findGroupKey = (pendingByGroup: Map<string, PendingDisconnect[]>, device: SerializableDeviceInfo) => {
    for (const [groupKey, entries] of pendingByGroup) {
        if (entries.some((entry) => isSameHardware(entry.device, device))) {
            return groupKey;
        }
    }

    return getGroupKey(device.groupId, device.kind);
};

const getOrderedKinds = (entries: PendingDisconnect[]) =>
    KIND_ORDER.filter((kind) => entries.some((entry) => entry.device.kind === kind));

const getDisconnectedSubject = (kinds: DeviceKind[]) => {
    const hasMicrophone = kinds.includes('audioinput');
    const hasSpeaker = kinds.includes('audiooutput');

    if (kinds.length === 1) {
        if (hasMicrophone) {
            return c('Info').t`Selected microphone has disconnected.`;
        }

        if (hasSpeaker) {
            return c('Info').t`Selected speaker has disconnected.`;
        }

        return c('Info').t`Selected camera has disconnected.`;
    }

    if (kinds.length === 2) {
        if (hasMicrophone && hasSpeaker) {
            return c('Info').t`Selected microphone and speaker have disconnected.`;
        }

        if (hasMicrophone) {
            return c('Info').t`Selected microphone and camera have disconnected.`;
        }

        return c('Info').t`Selected speaker and camera have disconnected.`;
    }

    return c('Info').t`Selected devices have disconnected.`;
};

const getReplacementSentence = (entries: PendingDisconnect[]) => {
    // Named in the same order as the kinds in the subject, not in the order they were reported
    const ordered = getOrderedKinds(entries).map((kind) => entries.find((entry) => entry.device.kind === kind));
    const labels = [...new Set(ordered.map((entry) => entry?.replacementLabel).filter(Boolean))];
    const [first, second, third] = labels;

    if (labels.length === 0) {
        return '';
    }

    if (labels.length === 1) {
        return c('Info').t`Now using ${first}.`;
    }

    if (labels.length === 2) {
        return c('Info').t`Now using ${first} and ${second}.`;
    }

    // One label per kind and there are only three kinds, so this is as long as the list can get
    return c('Info').t`Now using ${first}, ${second} and ${third}.`;
};

export const useDeviceNotifications = () => {
    const { createNotification } = useNotifications();

    const pendingDisconnectedRef = useRef(new Map<string, PendingDisconnect[]>());
    const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (flushTimeoutRef.current !== null) {
                clearTimeout(flushTimeoutRef.current);
            }
        };
    }, []);

    const flushDisconnected = () => {
        const groups = [...pendingDisconnectedRef.current.entries()];
        pendingDisconnectedRef.current.clear();

        for (const [groupKey, entries] of groups) {
            const subject = getDisconnectedSubject(getOrderedKinds(entries));
            const replacement = getReplacementSentence(entries);
            const text = replacement ? `${subject} ${replacement}` : subject;

            createNotification({
                key: `device-disconnected-${groupKey}`,
                type: 'warning',
                expiration: NOTIFICATION_EXPIRATION_MS,
                text,
            });
        }
    };

    const scheduleFlush = () => {
        if (flushTimeoutRef.current !== null) {
            return;
        }

        flushTimeoutRef.current = setTimeout(() => {
            flushTimeoutRef.current = null;
            flushDisconnected();
        }, GROUPING_WINDOW_MS);
    };

    const notifyActiveDeviceDisconnected = ({
        device,
        replacementLabel,
    }: {
        device: SerializableDeviceInfo;
        replacementLabel: string;
    }) => {
        const groupKey = findGroupKey(pendingDisconnectedRef.current, device);
        const entries = pendingDisconnectedRef.current.get(groupKey) ?? [];

        pendingDisconnectedRef.current.set(groupKey, [
            ...entries.filter((entry) => entry.device.kind !== device.kind),
            { device, replacementLabel },
        ]);

        scheduleFlush();
    };

    return { notifyActiveDeviceDisconnected };
};

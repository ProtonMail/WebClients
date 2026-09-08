import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import type { DeviceKind } from '@proton/meet/store/slices/deviceManagementSlice/types';

import { RECHECK_DELAY_MS } from './useDeviceListSync';

const NOTIFICATION_EXPIRATION_MS = 10000;

// A single piece of hardware reaches us as several devices: a headset is a microphone plus a speaker,
// a dock adds a camera. Each kind is handled by its own debounced pass off the same devicechange
// event, and a sibling can show up only in the re-enumerate, so the window has to outlast that one.
const GROUPING_WINDOW_MS = RECHECK_DELAY_MS + 100;

const KIND_ORDER: DeviceKind[] = ['audioinput', 'audiooutput', 'videoinput'];

interface PendingEntry {
    kind: DeviceKind;
    deviceLabel: string;
    onSwitch?: () => void;
}

const getSingleKindDisconnectedText = (kind: DeviceKind, deviceLabel: string) => {
    switch (kind) {
        case 'audioinput':
            return c('Info').t`Your microphone was disconnected. Now using ${deviceLabel}.`;
        case 'audiooutput':
            return c('Info').t`Your speaker was disconnected. Now using ${deviceLabel}.`;
        case 'videoinput':
            return c('Info').t`Your camera was disconnected. Now using ${deviceLabel}.`;
        default:
            return c('Info').t`Your device was disconnected. Now using ${deviceLabel}.`;
    }
};

// Grouped disconnections leave out the replacements: they are a different device per kind, and
// naming them all turns the notification into a list nobody reads.
const getMultipleKindsDisconnectedText = (kinds: DeviceKind[]) => {
    const disconnectedMicrophone = kinds.includes('audioinput');
    const disconnectedSpeaker = kinds.includes('audiooutput');
    const disconnectedCamera = kinds.includes('videoinput');

    if (disconnectedMicrophone && disconnectedSpeaker && disconnectedCamera) {
        return c('Info').t`Your microphone, speaker and camera were disconnected. Now using other devices.`;
    }
    if (disconnectedMicrophone && disconnectedSpeaker) {
        return c('Info').t`Your microphone and speaker were disconnected. Now using other devices.`;
    }
    if (disconnectedMicrophone && disconnectedCamera) {
        return c('Info').t`Your microphone and camera were disconnected. Now using other devices.`;
    }
    return c('Info').t`Your speaker and camera were disconnected. Now using other devices.`;
};

const getOrderedKinds = (entries: PendingEntry[]) => KIND_ORDER.filter((kind) => entries.some((e) => e.kind === kind));

export const useDeviceNotifications = () => {
    const { createNotification, removeNotification } = useNotifications();

    // Devices that came back are grouped by groupId, so a headset gets one notification with one
    // button. Disconnections cannot be: the device is already out of the list and all we know is its
    // replacement, so anything reported within the same window counts as one unplug.
    const pendingAvailableRef = useRef(new Map<string, PendingEntry[]>());
    const pendingDisconnectedRef = useRef<PendingEntry[]>([]);
    const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (flushTimeoutRef.current !== null) {
                clearTimeout(flushTimeoutRef.current);
            }
        };
    }, []);

    const flushDisconnected = () => {
        const entries = pendingDisconnectedRef.current;
        pendingDisconnectedRef.current = [];

        if (entries.length === 0) {
            return;
        }

        const kinds = getOrderedKinds(entries);
        const text =
            kinds.length === 1
                ? getSingleKindDisconnectedText(kinds[0], entries[0].deviceLabel)
                : getMultipleKindsDisconnectedText(kinds);

        createNotification({
            // Keyed by the kinds involved so a later, unrelated unplug stacks instead of replacing this one
            key: `device-disconnected-${kinds.join('-')}`,
            type: 'warning',
            expiration: NOTIFICATION_EXPIRATION_MS,
            text,
        });
    };

    const flushAvailable = () => {
        const groups = [...pendingAvailableRef.current.entries()];
        pendingAvailableRef.current.clear();

        for (const [groupKey, entries] of groups) {
            const deviceLabel = entries[0].deviceLabel;
            const handle = { id: 0 };

            handle.id = createNotification({
                key: `device-available-${groupKey}`,
                type: 'info',
                expiration: NOTIFICATION_EXPIRATION_MS,
                text: (
                    <span>
                        {c('Info').t`${deviceLabel} is available again`}{' '}
                        <InlineLinkButton
                            onClick={() => {
                                entries.forEach((entry) => entry.onSwitch?.());
                                removeNotification(handle.id);
                            }}
                        >
                            {c('Action').t`Use it`}
                        </InlineLinkButton>
                    </span>
                ),
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
            flushAvailable();
        }, GROUPING_WINDOW_MS);
    };

    const notifyPreferredAvailable = ({
        kind,
        groupId,
        deviceLabel,
        onSwitch,
    }: {
        kind: DeviceKind;
        groupId: string;
        deviceLabel: string;
        onSwitch: () => void;
    }) => {
        // Browsers that do not expose a groupId fall back to one notification per kind
        const groupKey = groupId || kind;
        const entries = pendingAvailableRef.current.get(groupKey) ?? [];

        pendingAvailableRef.current.set(groupKey, [
            ...entries.filter((entry) => entry.kind !== kind),
            { kind, deviceLabel, onSwitch },
        ]);

        scheduleFlush();
    };

    const notifyActiveDeviceDisconnected = ({ kind, deviceLabel }: { kind: DeviceKind; deviceLabel: string }) => {
        pendingDisconnectedRef.current = [
            ...pendingDisconnectedRef.current.filter((entry) => entry.kind !== kind),
            { kind, deviceLabel },
        ];

        scheduleFlush();
    };

    return { notifyPreferredAvailable, notifyActiveDeviceDisconnected };
};

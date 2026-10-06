import type { ReactNode } from 'react';

import { act, render, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CreateNotificationOptions } from '@proton/app-context/notifications/interfaces';
import type { SerializableDeviceInfo } from '@proton/meet/utils/deviceUtils';

import { useDeviceNotifications } from './useDeviceNotifications';

const notificationMocks = vi.hoisted(() => {
    let nextId = 1;
    return {
        createNotification: vi.fn((_options: CreateNotificationOptions) => nextId++),
        removeNotification: vi.fn(),
        resetIds: () => {
            nextId = 1;
        },
    };
});

vi.mock('@proton/app-context/useNotifications', () => ({ useNotifications: () => notificationMocks }));

const PAST_GROUPING_WINDOW_MS = 1_000;

const device = (kind: MediaDeviceKind, label: string, groupId: string): SerializableDeviceInfo => ({
    deviceId: `${kind}-${label}`,
    groupId,
    kind,
    label,
});

const setup = () => {
    const { result, unmount } = renderHook(() => useDeviceNotifications());

    const flush = () => {
        act(() => {
            vi.advanceTimersByTime(PAST_GROUPING_WINDOW_MS);
        });
    };

    return { ...result.current, flush, unmount };
};

const createdNotifications = () => notificationMocks.createNotification.mock.calls.map(([options]) => options);

const textOf = (node: ReactNode) => {
    const { container, unmount } = render(<>{node}</>);
    const text = container.textContent ?? '';
    unmount();
    return text;
};

describe('useDeviceNotifications', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        notificationMocks.resetIds();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    describe('the active device being disconnected', () => {
        it('names the kind that went away and the device that took over', () => {
            const { notifyActiveDeviceDisconnected, flush } = setup();

            notifyActiveDeviceDisconnected({
                device: device('audiooutput', 'AirPods', 'airpods-group'),
                replacementLabel: 'MacBook Pro Speakers',
            });

            flush();

            expect(notificationMocks.createNotification).toHaveBeenCalledTimes(1);
            expect(createdNotifications()[0]).toMatchObject({
                key: 'device-disconnected-airpods-group',
                type: 'warning',
            });
            expect(textOf(createdNotifications()[0].text)).toBe(
                'Selected speaker has disconnected. Now using MacBook Pro Speakers.'
            );
        });

        it('leaves out the replacement when there is none', () => {
            const { notifyActiveDeviceDisconnected, flush } = setup();

            notifyActiveDeviceDisconnected({
                device: device('audiooutput', 'AirPods', 'airpods-group'),
                replacementLabel: '',
            });

            flush();

            expect(textOf(createdNotifications()[0].text)).toBe('Selected speaker has disconnected.');
        });

        it('reports one headset that takes the microphone and the speaker with it once', () => {
            const { notifyActiveDeviceDisconnected, flush } = setup();

            notifyActiveDeviceDisconnected({
                device: device('audiooutput', 'Jabra Evolve2 30 (0b0e:0e31)', 'jabra-group'),
                replacementLabel: 'MacBook Pro Speakers',
            });
            notifyActiveDeviceDisconnected({
                device: device('audioinput', 'Jabra Evolve2 30 (0b0e:0e31)', 'jabra-group'),
                replacementLabel: 'MacBook Pro Microphone',
            });

            flush();

            expect(notificationMocks.createNotification).toHaveBeenCalledTimes(1);
            expect(createdNotifications()[0].key).toBe('device-disconnected-jabra-group');
            expect(textOf(createdNotifications()[0].text)).toBe(
                'Selected microphone and speaker have disconnected. Now using MacBook Pro Microphone and MacBook Pro Speakers.'
            );
        });

        it('reports two pieces of hardware lost at once separately', () => {
            const { notifyActiveDeviceDisconnected, flush } = setup();

            notifyActiveDeviceDisconnected({
                device: device('audioinput', 'Jabra Evolve2 30 (0b0e:0e31)', 'jabra-group'),
                replacementLabel: 'MacBook Pro Microphone',
            });
            notifyActiveDeviceDisconnected({
                device: device('videoinput', 'HD Pro Webcam C920 (046d:082d)', 'dock-group'),
                replacementLabel: 'FaceTime HD Camera',
            });

            flush();

            expect(createdNotifications().map((options) => options.key)).toEqual([
                'device-disconnected-jabra-group',
                'device-disconnected-dock-group',
            ]);
        });

        it('falls back to one notification per kind when the browser hides the groupId', () => {
            const { notifyActiveDeviceDisconnected, flush } = setup();

            notifyActiveDeviceDisconnected({
                device: device('audioinput', 'Headset Microphone (Jabra Evolve2 30)', ''),
                replacementLabel: 'MacBook Pro Microphone',
            });
            notifyActiveDeviceDisconnected({
                device: device('audiooutput', 'Headset Earphone (Jabra Evolve2 30)', ''),
                replacementLabel: 'MacBook Pro Speakers',
            });

            flush();

            expect(createdNotifications().map((options) => options.key)).toEqual([
                'device-disconnected-audioinput',
                'device-disconnected-audiooutput',
            ]);
        });

        describe('a webcam whose microphone and camera the browser puts in different groups', () => {
            it.each([
                ['Microphone (HD Pro Webcam C920)', 'HD Pro Webcam C920 (046d:082d)'],
                ['Microphone (2- C270 HD WEBCAM)', 'C270 HD WEBCAM'],
                ['Speakerphone (Brio 300)', 'Brio 300 (046d:0943)'],
            ])('reports %s and %s once', (microphoneLabel, cameraLabel) => {
                const { notifyActiveDeviceDisconnected, flush } = setup();

                notifyActiveDeviceDisconnected({
                    device: device('audioinput', microphoneLabel, 'microphone-group'),
                    replacementLabel: 'Microphone Array (Realtek(R) Audio)',
                });
                notifyActiveDeviceDisconnected({
                    device: device('videoinput', cameraLabel, 'camera-group'),
                    replacementLabel: 'Integrated Camera',
                });

                flush();

                expect(notificationMocks.createNotification).toHaveBeenCalledTimes(1);
                expect(createdNotifications()[0].key).toBe('device-disconnected-microphone-group');
                expect(textOf(createdNotifications()[0].text)).toBe(
                    'Selected microphone and camera have disconnected. Now using Microphone Array (Realtek(R) Audio) and Integrated Camera.'
                );
            });

            it('reports the camera first and the microphone after it as one device too', () => {
                const { notifyActiveDeviceDisconnected, flush } = setup();

                notifyActiveDeviceDisconnected({
                    device: device('videoinput', 'HD Pro Webcam C920 (046d:082d)', 'camera-group'),
                    replacementLabel: 'Integrated Camera',
                });
                notifyActiveDeviceDisconnected({
                    device: device('audioinput', 'Microphone (HD Pro Webcam C920)', 'microphone-group'),
                    replacementLabel: 'Microphone Array (Realtek(R) Audio)',
                });

                flush();

                expect(notificationMocks.createNotification).toHaveBeenCalledTimes(1);
                expect(createdNotifications()[0].key).toBe('device-disconnected-camera-group');
            });

            it('keeps a camera apart from a microphone of other hardware', () => {
                const { notifyActiveDeviceDisconnected, flush } = setup();

                notifyActiveDeviceDisconnected({
                    device: device('audioinput', 'Microphone (Brio 3000)', 'microphone-group'),
                    replacementLabel: 'Microphone Array (Realtek(R) Audio)',
                });
                notifyActiveDeviceDisconnected({
                    device: device('videoinput', 'Brio 300', 'camera-group'),
                    replacementLabel: 'Integrated Camera',
                });

                flush();

                expect(notificationMocks.createNotification).toHaveBeenCalledTimes(2);
            });
        });
    });

    describe('lifecycle', () => {
        it('drops pending notifications when the hook unmounts', () => {
            const { notifyActiveDeviceDisconnected, unmount } = setup();

            notifyActiveDeviceDisconnected({
                device: device('audiooutput', 'AirPods', 'airpods-group'),
                replacementLabel: 'MacBook Pro Speakers',
            });
            unmount();

            act(() => {
                vi.advanceTimersByTime(PAST_GROUPING_WINDOW_MS);
            });

            expect(notificationMocks.createNotification).not.toHaveBeenCalled();
        });
    });
});

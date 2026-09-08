import type { ReactNode } from 'react';

import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CreateNotificationOptions } from '@proton/app-context/notifications/interfaces';

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

    describe('a preferred device coming back', () => {
        it('reports the microphone and speaker of one headset as a single notification', () => {
            const { notifyPreferredAvailable, flush } = setup();

            notifyPreferredAvailable({
                kind: 'audioinput',
                groupId: 'jabra-group',
                deviceLabel: 'Jabra Evolve2 30 Analog Mono',
                onSwitch: vi.fn(),
            });
            notifyPreferredAvailable({
                kind: 'audiooutput',
                groupId: 'jabra-group',
                deviceLabel: 'Jabra Evolve2 30 Analog Stereo',
                onSwitch: vi.fn(),
            });

            flush();

            expect(notificationMocks.createNotification).toHaveBeenCalledTimes(1);
            expect(createdNotifications()[0].key).toBe('device-available-jabra-group');
        });

        it('switches every kind of the headset from the single action', () => {
            const { notifyPreferredAvailable, flush } = setup();
            const switchMicrophone = vi.fn();
            const switchSpeaker = vi.fn();

            notifyPreferredAvailable({
                kind: 'audioinput',
                groupId: 'jabra-group',
                deviceLabel: 'Jabra Evolve2 30 Analog Mono',
                onSwitch: switchMicrophone,
            });
            notifyPreferredAvailable({
                kind: 'audiooutput',
                groupId: 'jabra-group',
                deviceLabel: 'Jabra Evolve2 30 Analog Stereo',
                onSwitch: switchSpeaker,
            });

            flush();

            render(<>{createdNotifications()[0].text}</>);
            fireEvent.click(screen.getByRole('button'));

            expect(switchMicrophone).toHaveBeenCalledTimes(1);
            expect(switchSpeaker).toHaveBeenCalledTimes(1);
            expect(notificationMocks.removeNotification).toHaveBeenCalledWith(1);
        });

        it('keeps unrelated devices in their own notifications', () => {
            const { notifyPreferredAvailable, flush } = setup();

            notifyPreferredAvailable({
                kind: 'audiooutput',
                groupId: 'jabra-group',
                deviceLabel: 'Jabra Evolve2 30 Analog Stereo',
                onSwitch: vi.fn(),
            });
            notifyPreferredAvailable({
                kind: 'videoinput',
                groupId: 'brio-group',
                deviceLabel: 'Brio 100',
                onSwitch: vi.fn(),
            });

            flush();

            expect(notificationMocks.createNotification).toHaveBeenCalledTimes(2);
            expect(createdNotifications().map((options) => options.key)).toEqual([
                'device-available-jabra-group',
                'device-available-brio-group',
            ]);
        });

        it('falls back to one notification per kind when the browser hides the groupId', () => {
            const { notifyPreferredAvailable, flush } = setup();

            notifyPreferredAvailable({
                kind: 'audioinput',
                groupId: '',
                deviceLabel: 'Headset Microphone',
                onSwitch: vi.fn(),
            });
            notifyPreferredAvailable({
                kind: 'audiooutput',
                groupId: '',
                deviceLabel: 'Headset Speaker',
                onSwitch: vi.fn(),
            });

            flush();

            expect(createdNotifications().map((options) => options.key)).toEqual([
                'device-available-audioinput',
                'device-available-audiooutput',
            ]);
        });

        it('names the device that came back', () => {
            const { notifyPreferredAvailable, flush } = setup();

            notifyPreferredAvailable({
                kind: 'audiooutput',
                groupId: 'jabra-group',
                deviceLabel: 'Jabra Evolve2 30 Analog Stereo',
                onSwitch: vi.fn(),
            });

            flush();

            expect(textOf(createdNotifications()[0].text)).toContain('Jabra Evolve2 30 Analog Stereo');
        });
    });

    describe('the active device being disconnected', () => {
        it('names the replacement when a single kind is affected', () => {
            const { notifyActiveDeviceDisconnected, flush } = setup();

            notifyActiveDeviceDisconnected({ kind: 'audiooutput', deviceLabel: 'MacBook Pro Speakers' });

            flush();

            expect(notificationMocks.createNotification).toHaveBeenCalledTimes(1);
            expect(createdNotifications()[0]).toMatchObject({
                key: 'device-disconnected-audiooutput',
                type: 'warning',
            });
            expect(textOf(createdNotifications()[0].text)).toBe(
                'Your speaker was disconnected. Now using MacBook Pro Speakers.'
            );
        });

        it('combines the kinds lost in the same unplug into one notification', () => {
            const { notifyActiveDeviceDisconnected, flush } = setup();

            notifyActiveDeviceDisconnected({ kind: 'audioinput', deviceLabel: 'MacBook Pro Microphone' });
            notifyActiveDeviceDisconnected({ kind: 'audiooutput', deviceLabel: 'MacBook Pro Speakers' });

            flush();

            expect(notificationMocks.createNotification).toHaveBeenCalledTimes(1);
            expect(createdNotifications()[0].key).toBe('device-disconnected-audioinput-audiooutput');
            expect(textOf(createdNotifications()[0].text)).toBe(
                'Your microphone and speaker were disconnected. Now using other devices.'
            );
        });

        it('reports a dock that takes all three kinds with it as one notification', () => {
            const { notifyActiveDeviceDisconnected, flush } = setup();

            notifyActiveDeviceDisconnected({ kind: 'videoinput', deviceLabel: 'FaceTime HD Camera' });
            notifyActiveDeviceDisconnected({ kind: 'audioinput', deviceLabel: 'MacBook Pro Microphone' });
            notifyActiveDeviceDisconnected({ kind: 'audiooutput', deviceLabel: 'MacBook Pro Speakers' });

            flush();

            expect(notificationMocks.createNotification).toHaveBeenCalledTimes(1);
            expect(textOf(createdNotifications()[0].text)).toBe(
                'Your microphone, speaker and camera were disconnected. Now using other devices.'
            );
        });

        it('stacks a later unplug instead of replacing the previous one', () => {
            const { notifyActiveDeviceDisconnected, flush } = setup();

            notifyActiveDeviceDisconnected({ kind: 'audioinput', deviceLabel: 'MacBook Pro Microphone' });
            flush();

            notifyActiveDeviceDisconnected({ kind: 'videoinput', deviceLabel: 'FaceTime HD Camera' });
            flush();

            expect(createdNotifications().map((options) => options.key)).toEqual([
                'device-disconnected-audioinput',
                'device-disconnected-videoinput',
            ]);
        });
    });

    describe('lifecycle', () => {
        it('drops pending notifications when the hook unmounts', () => {
            const { notifyActiveDeviceDisconnected, unmount } = setup();

            notifyActiveDeviceDisconnected({ kind: 'audiooutput', deviceLabel: 'MacBook Pro Speakers' });
            unmount();

            act(() => {
                vi.advanceTimersByTime(PAST_GROUPING_WINDOW_MS);
            });

            expect(notificationMocks.createNotification).not.toHaveBeenCalled();
        });
    });
});

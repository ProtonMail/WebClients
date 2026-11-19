import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMeetAudioContext } from './meet-audio-context';

const createdContexts: FakeAudioContext[] = [];

class FakeAudioContext {
    sampleRate = 48_000;

    sinkId = '';

    private pendingSwitches = Promise.resolve();

    private heldUntil = Promise.resolve();

    setSinkId = vi.fn((deviceId: string) => {
        const heldUntil = this.heldUntil;
        this.pendingSwitches = this.pendingSwitches
            .then(() => heldUntil)
            .then(() => {
                this.sinkId = deviceId;
            });
        return this.pendingSwitches;
    });

    close = vi.fn(async () => {});

    constructor() {
        createdContexts.push(this);
    }

    holdSwitches() {
        let release = () => {};
        this.heldUntil = new Promise((resolve) => {
            release = resolve;
        });
        return release;
    }
}

describe('createMeetAudioContext', () => {
    beforeEach(() => {
        vi.stubGlobal('AudioContext', FakeAudioContext);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        createdContexts.length = 0;
    });

    it('moves the context to a different output device', async () => {
        const { setSinkId } = createMeetAudioContext({ reportMeetError: vi.fn() });
        const [context] = createdContexts;

        expect(await setSinkId('speakers')).toBe(true);
        expect(context.setSinkId).toHaveBeenCalledWith('speakers');
    });

    it('does not set the output device the context already renders to', async () => {
        const { setSinkId } = createMeetAudioContext({ reportMeetError: vi.fn() });
        const [context] = createdContexts;
        context.sinkId = 'speakers';

        expect(await setSinkId('speakers')).toBe(true);
        expect(context.setSinkId).not.toHaveBeenCalled();
    });

    it('moves back to the current output while the switch away from it is still pending', async () => {
        const { setSinkId } = createMeetAudioContext({ reportMeetError: vi.fn() });
        const [context] = createdContexts;
        context.sinkId = 'speakers';

        const switchToHeadset = setSinkId('headset');
        const switchBackToSpeakers = setSinkId('speakers');

        expect(await Promise.all([switchToHeadset, switchBackToSpeakers])).toEqual([true, true]);
        expect(context.sinkId).toBe('speakers');
    });

    it('gives a repeated request the outcome of the pending switch it joined', async () => {
        const reportMeetError = vi.fn();
        const { setSinkId } = createMeetAudioContext({ reportMeetError });
        const [context] = createdContexts;
        context.setSinkId.mockRejectedValueOnce(new Error('device not found'));

        const firstSwitch = setSinkId('headset');
        const repeatedSwitch = setSinkId('headset');

        expect(await Promise.all([firstSwitch, repeatedSwitch])).toEqual([false, false]);
        expect(context.setSinkId).toHaveBeenCalledTimes(1);
        expect(reportMeetError).toHaveBeenCalledTimes(1);
    });

    it('does not repeat a switch that is still pending', async () => {
        const { setSinkId } = createMeetAudioContext({ reportMeetError: vi.fn() });
        const [context] = createdContexts;

        const firstSwitch = setSinkId('headset');
        const repeatedSwitch = setSinkId('headset');

        expect(await Promise.all([firstSwitch, repeatedSwitch])).toEqual([true, true]);
        expect(context.setSinkId).toHaveBeenCalledTimes(1);
        expect(context.sinkId).toBe('headset');
    });

    it('tries a switch again once the previous attempt failed', async () => {
        const { setSinkId } = createMeetAudioContext({ reportMeetError: vi.fn() });
        const [context] = createdContexts;
        context.setSinkId.mockRejectedValueOnce(new Error('device not found'));

        expect(await setSinkId('headset')).toBe(false);
        expect(await setSinkId('headset')).toBe(true);
        expect(context.setSinkId).toHaveBeenCalledTimes(2);
        expect(context.sinkId).toBe('headset');
    });

    it('still treats a newer switch as pending when an older one settles', async () => {
        const { setSinkId } = createMeetAudioContext({ reportMeetError: vi.fn() });
        const [context] = createdContexts;

        const switchToHeadset = setSinkId('headset');
        const releaseSwitches = context.holdSwitches();
        const switchToSpeakers = setSinkId('speakers');
        await switchToHeadset;
        const repeatedSwitchToSpeakers = setSinkId('speakers');
        releaseSwitches();

        expect(await Promise.all([switchToSpeakers, repeatedSwitchToSpeakers])).toEqual([true, true]);
        expect(context.setSinkId).toHaveBeenCalledTimes(2);
        expect(context.sinkId).toBe('speakers');
    });
});

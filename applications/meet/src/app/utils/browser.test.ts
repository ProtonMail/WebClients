import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { outputlessAudioContextOptions, supportsSetSinkId } from './browser';

const browserHelpers = vi.hoisted(() => ({
    isMobile: vi.fn(() => false),
    isFirefox: vi.fn(() => false),
    isSafari: vi.fn(() => false),
}));

vi.mock('@proton/shared/lib/helpers/browser', () => browserHelpers);

const originalAudioContext = globalThis.AudioContext;

const setAudioContextSinkSupport = (supported: boolean) => {
    class FakeAudioContext {}

    if (supported) {
        (FakeAudioContext.prototype as any).setSinkId = () => Promise.resolve();
    }

    globalThis.AudioContext = FakeAudioContext as unknown as typeof AudioContext;
};

describe('supportsSetSinkId', () => {
    beforeEach(() => {
        setAudioContextSinkSupport(true);
    });

    afterEach(() => {
        globalThis.AudioContext = originalAudioContext;
        vi.clearAllMocks();
    });

    it('is supported when both the element and the AudioContext expose setSinkId', () => {
        expect(supportsSetSinkId()).toBe(true);
    });

    // Chrome 49 shipped HTMLMediaElement.setSinkId and Chrome 110 the AudioContext one, and WebKit has
    // the element API without the other. Testing the element let both into a switch that always throws.
    it('is not supported when only the audio element exposes setSinkId', () => {
        setAudioContextSinkSupport(false);

        expect(supportsSetSinkId()).toBe(false);
    });

    it('is not supported when there is no AudioContext at all', () => {
        globalThis.AudioContext = undefined as unknown as typeof AudioContext;

        expect(supportsSetSinkId()).toBe(false);
    });

    it.each([
        ['mobile', 'isMobile'],
        ['firefox', 'isFirefox'],
        ['safari', 'isSafari'],
    ] as const)('is not supported on %s', (_label, helper) => {
        browserHelpers[helper].mockReturnValue(true);

        expect(supportsSetSinkId()).toBe(false);
    });
});

describe('outputlessAudioContextOptions', () => {
    afterEach(() => {
        globalThis.AudioContext = originalAudioContext;
    });

    it('asks for no output device when the AudioContext supports it', () => {
        setAudioContextSinkSupport(true);

        expect(outputlessAudioContextOptions({ sampleRate: 48000 })).toEqual({
            sampleRate: 48000,
            sinkId: { type: 'none' },
        });
    });

    it('leaves the options untouched when it does not', () => {
        setAudioContextSinkSupport(false);

        expect(outputlessAudioContextOptions({ sampleRate: 48000 })).toEqual({ sampleRate: 48000 });
    });
});

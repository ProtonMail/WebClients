import { act, renderHook } from '@testing-library/react';
import type { RemoteTrackPublication, Track } from 'livekit-client';

import { readInboundRtp } from '../../../../../utils/e2eeRecovery/inboundRtpStats';
import { useIsReceivingVideoFrames } from './useIsReceivingVideoFrames';

vi.mock('../../../../../utils/e2eeRecovery/inboundRtpStats', () => ({
    readInboundRtp: vi.fn(),
}));

const readInboundRtpMock = vi.mocked(readInboundRtp);

const createPublication = () => ({ trackSid: 'TR_1', track: {} as Track }) as unknown as RemoteTrackPublication;

const framesDecodedSequence = (...values: (number | undefined)[]) => {
    values.forEach((framesDecoded) => {
        readInboundRtpMock.mockResolvedValueOnce(framesDecoded === undefined ? undefined : { framesDecoded });
    });
};

const advanceSample = async () => {
    await act(async () => {
        await vi.advanceTimersByTimeAsync(1_000);
    });
};

const renderActive = async (publication: RemoteTrackPublication) => {
    const rendered = renderHook(({ isActive }) => useIsReceivingVideoFrames(publication, isActive), {
        initialProps: { isActive: true },
    });
    await act(async () => {});
    return rendered;
};

describe('useIsReceivingVideoFrames', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        readInboundRtpMock.mockReset();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('stays true while the decoded frame count grows', async () => {
        framesDecodedSequence(10, 20, 30);
        const { result } = await renderActive(createPublication());

        expect(result.current).toBe(true);
        await advanceSample();
        expect(result.current).toBe(true);
        await advanceSample();
        expect(result.current).toBe(true);
    });

    it('turns false once the decoded frame count stops growing, and true when it grows again', async () => {
        framesDecodedSequence(10, 10, 15);
        const { result } = await renderActive(createPublication());

        await advanceSample();
        expect(result.current).toBe(false);

        await advanceSample();
        expect(result.current).toBe(true);
    });

    it('keeps the video when a sample has no inbound video stats', async () => {
        framesDecodedSequence(undefined, undefined);
        const { result } = await renderActive(createPublication());

        await advanceSample();
        expect(result.current).toBe(true);
    });

    it('does not compare the counts of two different tracks of one publication', async () => {
        const publication = createPublication();
        framesDecodedSequence(900, 900);
        const { result, rerender } = await renderActive(publication);
        await advanceSample();
        expect(result.current).toBe(false);

        (publication as { track: Track }).track = {} as Track;
        framesDecodedSequence(30, 60);
        await advanceSample();
        rerender({ isActive: true });
        expect(result.current).toBe(true);
        await advanceSample();
        expect(result.current).toBe(true);
    });

    it('starts over on the next activation', async () => {
        framesDecodedSequence(10, 10);
        const { result, rerender } = await renderActive(createPublication());
        await advanceSample();
        expect(result.current).toBe(false);

        rerender({ isActive: false });
        expect(result.current).toBe(true);

        framesDecodedSequence(20);
        rerender({ isActive: true });
        expect(result.current).toBe(true);
    });

    it('does not sample and reads true while inactive', async () => {
        const { result, rerender } = await renderActive(createPublication());
        rerender({ isActive: false });
        readInboundRtpMock.mockClear();

        await advanceSample();
        await advanceSample();

        expect(readInboundRtpMock).not.toHaveBeenCalled();
        expect(result.current).toBe(true);
    });
});

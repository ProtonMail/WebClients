import { useParticipants } from '@livekit/components-react';
import { renderHook } from '@testing-library/react';

import { qualityConstants } from '../qualityConstants';
import { Quality, QualityScenarios } from '../types';
import * as useCurrentScreenShareFunctions from './useCurrentScreenShare';
import { useParticipantResolution } from './useParticipantResolution';

vi.mock('@livekit/components-react', () => ({
    useParticipants: vi.fn(),
}));

describe('useParticipantResolution', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterAll(() => {
        vi.resetModules();
    });

    it('should return the PortraitView value if there is no screen share and having 3 or fewer participants', () => {
        // @ts-expect-error
        vi.spyOn(useCurrentScreenShareFunctions, 'useCurrentScreenShare').mockReturnValue({
            videoTrack: null,
        });

        // @ts-expect-error
        useParticipants.mockReturnValue(Array(3).fill({}));

        const { result } = renderHook(() => useParticipantResolution());

        expect(result.current).toEqual(qualityConstants[QualityScenarios.PortraitView][Quality.Default]);
    });

    it('should return the MediumView value if there is no screen share and having between 4 and 8 participants', () => {
        // @ts-expect-error
        vi.spyOn(useCurrentScreenShareFunctions, 'useCurrentScreenShare').mockReturnValue({
            videoTrack: null,
        });

        // @ts-expect-error
        useParticipants.mockReturnValue(Array(5).fill({}));

        const { result } = renderHook(() => useParticipantResolution());

        expect(result.current).toEqual(qualityConstants[QualityScenarios.MediumView][Quality.Default]);
    });

    it('should return the SmallView value if there is no screen share and having more than 8 participants', () => {
        // @ts-expect-error
        vi.spyOn(useCurrentScreenShareFunctions, 'useCurrentScreenShare').mockReturnValue({
            videoTrack: null,
        });

        // @ts-expect-error
        useParticipants.mockReturnValue(Array(9).fill({}));

        const { result } = renderHook(() => useParticipantResolution());

        expect(result.current).toEqual(qualityConstants[QualityScenarios.SmallView][Quality.Default]);
    });

    it('should return the value for screen share if there is a screen share', () => {
        vi.spyOn(useCurrentScreenShareFunctions, 'useCurrentScreenShare').mockReturnValue({
            // @ts-expect-error
            videoTrack: {},
        });

        // @ts-expect-error
        useParticipants.mockReturnValue(Array(5).fill({}));

        const { result } = renderHook(() => useParticipantResolution());

        expect(result.current).toEqual(qualityConstants[QualityScenarios.ScreenShare][Quality.Default]);
    });
});

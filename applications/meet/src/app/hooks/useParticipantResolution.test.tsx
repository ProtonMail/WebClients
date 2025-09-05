import { useParticipants } from '@livekit/components-react';
import { renderHook } from '@testing-library/react';

import { MeetContext } from '../contexts/MeetContext';
import { qualityConstants } from '../qualityConstants';
import { QualityScenarios } from '../types';
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

    const Wrapper = ({ children }: { children: React.ReactNode }) => {
        // @ts-expect-error - providing mock data
        return <MeetContext.Provider value={{ isScreenShare: false }}>{children}</MeetContext.Provider>;
    };

    it('should return the PortraitView value if there is no screen share and having 3 or fewer participants', () => {
        // @ts-expect-error
        useParticipants.mockReturnValue(Array(3).fill({}));

        const { result } = renderHook(() => useParticipantResolution(), { wrapper: Wrapper });

        expect(result.current).toEqual(qualityConstants[QualityScenarios.PortraitView]);
    });

    it('should return the MediumView value if there is no screen share and having between 4 and 8 participants', () => {
        // @ts-expect-error
        useParticipants.mockReturnValue(Array(5).fill({}));

        const { result } = renderHook(() => useParticipantResolution(), { wrapper: Wrapper });

        expect(result.current).toEqual(qualityConstants[QualityScenarios.MediumView]);
    });

    it('should return the SmallView value if there is no screen share and having more than 8 participants', () => {
        // @ts-expect-error
        useParticipants.mockReturnValue(Array(9).fill({}));

        const { result } = renderHook(() => useParticipantResolution(), { wrapper: Wrapper });

        expect(result.current).toEqual(qualityConstants[QualityScenarios.SmallView]);
    });

    it('should return the value for screen share if there is a screen share', () => {
        // @ts-expect-error
        useParticipants.mockReturnValue(Array(5).fill({}));

        const { result } = renderHook(() => useParticipantResolution(), {
            wrapper: ({ children }: { children: React.ReactNode }) => {
                // @ts-expect-error - providing mock data
                return <MeetContext.Provider value={{ isScreenShare: true }}>{children}</MeetContext.Provider>;
            },
        });

        expect(result.current).toEqual(qualityConstants[QualityScenarios.ScreenShare]);
    });
});

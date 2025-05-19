import { renderHook } from '@testing-library/react';
import { Track, VideoQuality } from 'livekit-client';

import { useSetLocalVideoQuality } from './useLocalVideoQuality';

describe('useLocalVideoQuality', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should allow for setting the local video quality to a given value', () => {
        const mockSetPublishingQuality = vi.hoisted(() => vi.fn());

        vi.mock('@livekit/components-react', () => ({
            useLocalParticipant: vi.fn().mockReturnValue({
                localParticipant: {
                    trackPublications: new Map([
                        [
                            'video',
                            {
                                videoTrack: { setPublishingQuality: mockSetPublishingQuality },
                                kind: Track.Kind.Video,
                                source: Track.Source.Camera,
                            },
                        ],
                    ]),
                },
            }),
        }));

        const { result } = renderHook(() => useSetLocalVideoQuality());

        result.current(VideoQuality.MEDIUM);

        expect(mockSetPublishingQuality).toHaveBeenCalledWith(VideoQuality.MEDIUM);
    });
});

import { renderHook } from '@testing-library/react';

import { AnnouncementPriority } from '@proton/components/components/liveAnnouncer/types';

import { useCaptionsAvailability } from '../../../hooks/captions/useCaptionsAvailability';
import { useLiveCaptionsFeatureEnabled } from '../../../hooks/captions/useLiveCaptionsFeatureEnabled';
import { useCaptionsAvailabilityAnnouncements } from './useCaptionsAvailabilityAnnouncements';

const announce = vi.fn();

vi.mock('@proton/components/components/liveAnnouncer/useAnnounce', () => ({ useAnnounce: () => announce }));
vi.mock('../../../hooks/captions/useCaptionsAvailability', () => ({ useCaptionsAvailability: vi.fn() }));
vi.mock('../../../hooks/captions/useLiveCaptionsFeatureEnabled', () => ({
    useLiveCaptionsFeatureEnabled: vi.fn(),
}));

const setup = ({
    isCaptionsDisabled,
    featureEnabled = true,
}: {
    isCaptionsDisabled: boolean;
    featureEnabled?: boolean;
}) => {
    vi.mocked(useLiveCaptionsFeatureEnabled).mockReturnValue(featureEnabled);
    vi.mocked(useCaptionsAvailability).mockReturnValue({ isCaptionsDisabled });

    const { rerender } = renderHook(() => useCaptionsAvailabilityAnnouncements());

    return {
        setDisabled: (next: boolean) => {
            vi.mocked(useCaptionsAvailability).mockReturnValue({ isCaptionsDisabled: next });
            rerender();
        },
    };
};

describe('useCaptionsAvailabilityAnnouncements', () => {
    beforeEach(() => {
        announce.mockClear();
    });

    it('does not announce the availability found on mount', () => {
        setup({ isCaptionsDisabled: true });

        expect(announce).not.toHaveBeenCalled();
    });

    it('announces when the host disables captions', () => {
        const { setDisabled } = setup({ isCaptionsDisabled: false });

        setDisabled(true);

        expect(announce).toHaveBeenCalledTimes(1);
        expect(announce).toHaveBeenCalledWith('Live captions turned off for this meeting', expect.anything());
    });

    it('announces when the host allows captions again', () => {
        const { setDisabled } = setup({ isCaptionsDisabled: true });

        setDisabled(false);

        expect(announce).toHaveBeenCalledTimes(1);
        expect(announce).toHaveBeenCalledWith('Live captions allowed for this meeting', expect.anything());
    });

    it('announces with high priority so a reconnect does not drop it', () => {
        const { setDisabled } = setup({ isCaptionsDisabled: false });

        setDisabled(true);

        expect(announce).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ priority: AnnouncementPriority.High })
        );
    });

    it('announces every change, even the same state again right after', () => {
        const { setDisabled } = setup({ isCaptionsDisabled: false });

        setDisabled(true);
        setDisabled(false);
        setDisabled(true);

        expect(announce).toHaveBeenCalledTimes(3);
        const keys = announce.mock.calls.map(([, options]) => options.dedupeKey);
        expect(new Set(keys).size).toBe(3);
    });

    it('does not announce a rerender with the same value', () => {
        const { setDisabled } = setup({ isCaptionsDisabled: false });

        setDisabled(true);
        setDisabled(true);

        expect(announce).toHaveBeenCalledTimes(1);
    });

    it('does not announce when the feature is off', () => {
        const { setDisabled } = setup({ isCaptionsDisabled: false, featureEnabled: false });

        setDisabled(true);

        expect(announce).not.toHaveBeenCalled();
    });
});

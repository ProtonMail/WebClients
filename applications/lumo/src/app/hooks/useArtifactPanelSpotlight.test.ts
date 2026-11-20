import { act, renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { isMobile } from '@proton/shared/lib/helpers/browser';

import { ARTIFACT_PANEL_SPOTLIGHT_ID } from '../constants/artifactOnboarding';
import { useIsGuest } from '../providers/IsGuestProvider';
import { useLumoSelector } from '../redux/hooks';
import {
    hasSeenArtifactPanelSpotlightLocally,
    markArtifactPanelSpotlightSeenLocally,
} from '../util/artifactPanelSpotlightStorage';
import { useArtifactPanelSpotlight } from './useArtifactPanelSpotlight';
import { useFeatureFlags } from './useFeatureFlags';
import { useLumoFlags } from './useLumoFlags';

vi.mock('../providers/IsGuestProvider', () => ({
    useIsGuest: vi.fn(),
}));
vi.mock('../redux/hooks', () => ({
    useLumoSelector: vi.fn(),
}));
vi.mock('../util/artifactPanelSpotlightStorage', () => ({
    hasSeenArtifactPanelSpotlightLocally: vi.fn(),
    markArtifactPanelSpotlightSeenLocally: vi.fn(),
}));
vi.mock('./useFeatureFlags', () => ({
    useFeatureFlags: vi.fn(),
}));
vi.mock('./useLumoFlags', () => ({
    useLumoFlags: vi.fn(),
}));
vi.mock('@proton/shared/lib/helpers/browser', () => ({
    isMobile: vi.fn(),
}));

const mockedIsMobile = isMobile as Mock;
const mockedUseIsGuest = useIsGuest as Mock;
const mockedUseLumoSelector = useLumoSelector as Mock;
const mockedUseFeatureFlags = useFeatureFlags as Mock;
const mockedUseLumoFlags = useLumoFlags as Mock;
const mockedHasSeenLocally = hasSeenArtifactPanelSpotlightLocally as Mock;
const mockedMarkSeenLocally = markArtifactPanelSpotlightSeenLocally as Mock;

const dismissFlag = vi.fn();

type DismissedFlag = { id: string; versionId: string; dismissedAt: number; wasDeclined: boolean };

const setup = ({
    artifactsView = true,
    artifactsViewSpotlight = true,
    isGuest = false,
    featureFlags = [],
    settingsFeatureFlags = [],
    hasSeenLocally = false,
    lumoUserSettingsBootstrapped = true,
    mobile = false,
}: {
    artifactsView?: boolean;
    artifactsViewSpotlight?: boolean;
    isGuest?: boolean;
    featureFlags?: DismissedFlag[];
    settingsFeatureFlags?: DismissedFlag[];
    hasSeenLocally?: boolean;
    lumoUserSettingsBootstrapped?: boolean;
    mobile?: boolean;
} = {}) => {
    mockedUseLumoFlags.mockReturnValue({ artifactsView, artifactsViewSpotlight });
    mockedUseIsGuest.mockReturnValue(isGuest);
    mockedUseFeatureFlags.mockReturnValue({ featureFlags, dismissFlag });
    mockedUseLumoSelector.mockImplementation((selector) => {
        return selector({
            lumoUserSettings: { featureFlags: settingsFeatureFlags },
            initialization: { lumoUserSettingsBootstrapped },
        });
    });
    mockedHasSeenLocally.mockReturnValue(hasSeenLocally);
    mockedIsMobile.mockReturnValue(mobile);
};

const dismissedRecord: DismissedFlag = {
    id: ARTIFACT_PANEL_SPOTLIGHT_ID,
    versionId: 'release',
    dismissedAt: 1,
    wasDeclined: false,
};

describe('useArtifactPanelSpotlight', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows for a first-time auth user when it can display', () => {
        setup();
        const { result } = renderHook(() => {
            return useArtifactPanelSpotlight(true);
        });
        expect(result.current.shouldShowSpotlight).toBe(true);
    });

    it('does not show when the panel cannot display it', () => {
        setup();
        const { result } = renderHook(() => {
            return useArtifactPanelSpotlight(false);
        });
        expect(result.current.shouldShowSpotlight).toBe(false);
    });

    it('does not show when artifactsViewSpotlight is disabled', () => {
        setup({ artifactsViewSpotlight: false });
        const { result } = renderHook(() => {
            return useArtifactPanelSpotlight(true);
        });
        expect(result.current.shouldShowSpotlight).toBe(false);
    });

    it('does not show before auth user settings are bootstrapped', () => {
        setup({ lumoUserSettingsBootstrapped: false });
        const { result } = renderHook(() => {
            return useArtifactPanelSpotlight(true);
        });
        expect(result.current.shouldShowSpotlight).toBe(false);
    });

    it('does not show on mobile devices', () => {
        setup({ mobile: true });
        const { result } = renderHook(() => {
            return useArtifactPanelSpotlight(true);
        });
        expect(result.current.shouldShowSpotlight).toBe(false);
    });

    it('does not show when an auth user already dismissed it on another device', () => {
        setup({ settingsFeatureFlags: [dismissedRecord] });
        const { result } = renderHook(() => {
            return useArtifactPanelSpotlight(true);
        });
        expect(result.current.shouldShowSpotlight).toBe(false);
    });

    it('does not show for a guest who has seen it locally', () => {
        setup({ isGuest: true, hasSeenLocally: true, lumoUserSettingsBootstrapped: false });
        const { result } = renderHook(() => {
            return useArtifactPanelSpotlight(true);
        });
        expect(result.current.shouldShowSpotlight).toBe(false);
    });

    it('dismisses via feature flags for auth users', () => {
        setup();
        const { result } = renderHook(() => {
            return useArtifactPanelSpotlight(true);
        });

        act(() => {
            result.current.markSpotlightSeen();
        });

        expect(dismissFlag).toHaveBeenCalledWith(ARTIFACT_PANEL_SPOTLIGHT_ID, 'release', false);
        expect(result.current.shouldShowSpotlight).toBe(false);
    });

    it('stores the seen state locally for guests', () => {
        setup({ isGuest: true });
        const { result } = renderHook(() => {
            return useArtifactPanelSpotlight(true);
        });

        act(() => {
            result.current.markSpotlightSeen();
        });

        expect(mockedMarkSeenLocally).toHaveBeenCalledTimes(1);
        expect(dismissFlag).not.toHaveBeenCalled();
        expect(result.current.shouldShowSpotlight).toBe(false);
    });

    it('marks seen once it has been displayed and then hidden', () => {
        setup();
        const { result, rerender } = renderHook(
            ({ canDisplay }) => {
                return useArtifactPanelSpotlight(canDisplay);
            },
            { initialProps: { canDisplay: true } }
        );

        act(() => {
            result.current.handleSpotlightDisplayed();
        });
        rerender({ canDisplay: false });

        expect(dismissFlag).toHaveBeenCalledTimes(1);
    });

    it('does not mark seen when hidden before it was ever displayed', () => {
        setup();
        const { rerender } = renderHook(
            ({ canDisplay }) => {
                return useArtifactPanelSpotlight(canDisplay);
            },
            { initialProps: { canDisplay: false } }
        );

        rerender({ canDisplay: true });
        rerender({ canDisplay: false });

        expect(dismissFlag).not.toHaveBeenCalled();
    });

    it('marks seen when the panel unmounts after it was displayed', () => {
        setup();
        const { result, unmount } = renderHook(() => {
            return useArtifactPanelSpotlight(true);
        });

        act(() => {
            result.current.handleSpotlightDisplayed();
        });
        unmount();

        expect(dismissFlag).toHaveBeenCalledTimes(1);
    });
});

import { act, renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { isMobile } from '@proton/shared/lib/helpers/browser';

import { ARTIFACT_CREATE_SPOTLIGHT_ID, ARTIFACT_NEW_LABEL_END_DATE } from '../constants/artifactOnboarding';
import { useIsGuest } from '../providers/IsGuestProvider';
import { useLumoSelector } from '../redux/hooks';
import {
    hasSeenArtifactCreateSpotlightLocally,
    markArtifactCreateSpotlightSeenLocally,
} from '../util/artifactCreateSpotlightStorage';
import { useArtifactCreateSpotlight } from './useArtifactCreateSpotlight';
import { useFeatureFlags } from './useFeatureFlags';
import { useIsLumoSmallScreen } from './useIsLumoSmallScreen';
import { useLumoFlags } from './useLumoFlags';

vi.mock('../providers/IsGuestProvider', () => ({
    useIsGuest: vi.fn(),
}));
vi.mock('../redux/hooks', () => ({
    useLumoSelector: vi.fn(),
}));
vi.mock('../util/artifactCreateSpotlightStorage', () => ({
    hasSeenArtifactCreateSpotlightLocally: vi.fn(),
    markArtifactCreateSpotlightSeenLocally: vi.fn(),
}));
vi.mock('./useFeatureFlags', () => ({
    useFeatureFlags: vi.fn(),
}));
vi.mock('./useIsLumoSmallScreen', () => ({
    useIsLumoSmallScreen: vi.fn(),
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
const mockedUseIsLumoSmallScreen = useIsLumoSmallScreen as Mock;
const mockedHasSeenLocally = hasSeenArtifactCreateSpotlightLocally as Mock;
const mockedMarkSeenLocally = markArtifactCreateSpotlightSeenLocally as Mock;

const dismissFlag = vi.fn();

const setup = ({
    artifactsView = true,
    artifactsViewSpotlight = true,
    isGuest = false,
    isSmallScreen = false,
    featureFlags = [],
    settingsFeatureFlags = [],
    hasSeenLocally = false,
    lumoUserSettingsBootstrapped = true,
}: {
    artifactsView?: boolean;
    artifactsViewSpotlight?: boolean;
    isGuest?: boolean;
    isSmallScreen?: boolean;
    featureFlags?: { id: string; versionId: string; dismissedAt: number; wasDeclined: boolean }[];
    settingsFeatureFlags?: { id: string; versionId: string; dismissedAt: number; wasDeclined: boolean }[];
    hasSeenLocally?: boolean;
    lumoUserSettingsBootstrapped?: boolean;
} = {}) => {
    mockedUseLumoFlags.mockReturnValue({ artifactsView, artifactsViewSpotlight });
    mockedUseIsGuest.mockReturnValue(isGuest);
    mockedUseIsLumoSmallScreen.mockReturnValue({ isSmallScreen, isMediumScreen: false });
    mockedUseFeatureFlags.mockReturnValue({ featureFlags, dismissFlag });
    mockedUseLumoSelector.mockImplementation((selector) =>
        selector({
            lumoUserSettings: { featureFlags: settingsFeatureFlags },
            initialization: { lumoUserSettingsBootstrapped },
        })
    );
    mockedHasSeenLocally.mockReturnValue(hasSeenLocally);
    mockedIsMobile.mockReturnValue(false);
};

describe('useArtifactCreateSpotlight', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Pin the clock before the New label end date so the tests don't depend on the real date.
        vi.useFakeTimers({ now: ARTIFACT_NEW_LABEL_END_DATE - 24 * 60 * 60 * 1000 });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('hides the spotlight and the New label once the end date has passed', () => {
        vi.setSystemTime(ARTIFACT_NEW_LABEL_END_DATE);
        setup();

        const { result } = renderHook(() => useArtifactCreateSpotlight(true));

        expect(result.current.shouldShowSpotlight).toBe(false);
        expect(result.current.showNewLabel).toBe(false);
    });

    it('shows the spotlight for a first-time auth user when artifactsView is enabled', () => {
        setup();

        const { result } = renderHook(() => useArtifactCreateSpotlight(true));

        expect(result.current.shouldShowSpotlight).toBe(true);
        expect(result.current.showNewLabel).toBe(true);
    });

    it('hides the spotlight when canDisplay is false', () => {
        setup();

        const { result } = renderHook(() => useArtifactCreateSpotlight(false));

        expect(result.current.shouldShowSpotlight).toBe(false);
    });

    it('hides the spotlight on small screens', () => {
        setup({ isSmallScreen: true });

        const { result } = renderHook(() => useArtifactCreateSpotlight(true));

        expect(result.current.shouldShowSpotlight).toBe(false);
    });

    it('hides the spotlight on mobile devices', () => {
        setup();
        mockedIsMobile.mockReturnValue(true);

        const { result } = renderHook(() => useArtifactCreateSpotlight(true));

        expect(result.current.shouldShowSpotlight).toBe(false);
        expect(result.current.showNewLabel).toBe(true);
    });

    it('hides the spotlight when artifactsView is disabled', () => {
        setup({ artifactsView: false });

        const { result } = renderHook(() => useArtifactCreateSpotlight(true));

        expect(result.current.shouldShowSpotlight).toBe(false);
    });

    it('hides the spotlight for auth users until lumo user settings have bootstrapped', () => {
        setup({ isGuest: false, lumoUserSettingsBootstrapped: false });

        const { result } = renderHook(() => useArtifactCreateSpotlight(true));

        expect(result.current.shouldShowSpotlight).toBe(false);
    });

    it('hides the spotlight and New label when artifactsViewSpotlight is disabled', () => {
        setup({ artifactsViewSpotlight: false });

        const { result } = renderHook(() => useArtifactCreateSpotlight(true));

        expect(result.current.shouldShowSpotlight).toBe(false);
        expect(result.current.showNewLabel).toBe(false);
    });

    it('shows the New label while artifact onboarding is active', () => {
        setup({
            featureFlags: [
                {
                    id: ARTIFACT_CREATE_SPOTLIGHT_ID,
                    versionId: 'release',
                    dismissedAt: Date.now(),
                    wasDeclined: false,
                },
            ],
        });

        const { result } = renderHook(() => useArtifactCreateSpotlight(true));

        expect(result.current.shouldShowSpotlight).toBe(false);
        expect(result.current.showNewLabel).toBe(true);
    });

    it('persists guest dismissal in dedicated local storage', () => {
        setup({ isGuest: true });

        const { result } = renderHook(() => useArtifactCreateSpotlight(true));

        act(() => {
            result.current.markSpotlightSeen();
        });

        expect(mockedMarkSeenLocally).toHaveBeenCalled();
    });

    it('persists auth dismissal through feature flags', () => {
        setup();

        const { result } = renderHook(() => useArtifactCreateSpotlight(true));

        act(() => {
            result.current.markSpotlightSeen();
        });

        expect(dismissFlag).toHaveBeenCalledWith(ARTIFACT_CREATE_SPOTLIGHT_ID, 'release', false);
    });

    it('uses guest local storage to determine whether the spotlight was seen', () => {
        setup({ isGuest: true, hasSeenLocally: true });

        const { result } = renderHook(() => useArtifactCreateSpotlight(true));

        expect(result.current.shouldShowSpotlight).toBe(false);
        expect(result.current.showNewLabel).toBe(true);
    });
});

import { act, renderHook } from '@testing-library/react';

import { isMobile } from '@proton/shared/lib/helpers/browser';

import { ARTIFACT_CREATE_SPOTLIGHT_ID } from '../constants/artifactOnboarding';
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

jest.mock('../providers/IsGuestProvider', () => ({
    useIsGuest: jest.fn(),
}));
jest.mock('../redux/hooks', () => ({
    useLumoSelector: jest.fn(),
}));
jest.mock('../util/artifactCreateSpotlightStorage', () => ({
    hasSeenArtifactCreateSpotlightLocally: jest.fn(),
    markArtifactCreateSpotlightSeenLocally: jest.fn(),
}));
jest.mock('./useFeatureFlags', () => ({
    useFeatureFlags: jest.fn(),
}));
jest.mock('./useIsLumoSmallScreen', () => ({
    useIsLumoSmallScreen: jest.fn(),
}));
jest.mock('./useLumoFlags', () => ({
    useLumoFlags: jest.fn(),
}));
jest.mock('@proton/shared/lib/helpers/browser', () => ({
    isMobile: jest.fn(),
}));

const mockedIsMobile = isMobile as jest.Mock;
const mockedUseIsGuest = useIsGuest as jest.Mock;
const mockedUseLumoSelector = useLumoSelector as jest.Mock;
const mockedUseFeatureFlags = useFeatureFlags as jest.Mock;
const mockedUseLumoFlags = useLumoFlags as jest.Mock;
const mockedUseIsLumoSmallScreen = useIsLumoSmallScreen as jest.Mock;
const mockedHasSeenLocally = hasSeenArtifactCreateSpotlightLocally as jest.Mock;
const mockedMarkSeenLocally = markArtifactCreateSpotlightSeenLocally as jest.Mock;

const dismissFlag = jest.fn();

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
        jest.clearAllMocks();
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

import { renderHook } from '@testing-library/react-hooks';

import { useOrganization } from '@proton/account/organization/hooks';
import useFeature from '@proton/features/useFeature';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import { useFlagsStatus } from '@proton/unleash/proxy';
import { useFlag } from '@proton/unleash/useFlag';

import { useCategoriesData } from './useCategoriesData';

jest.mock('@proton/account/organization/hooks');
jest.mock('@proton/features/useFeature');
jest.mock('@proton/unleash/proxy');
jest.mock('@proton/redux-shared-store/sharedProvider');
jest.mock('@proton/unleash/useFlag');

jest.mock('@proton/mail/store/mailSettings/hooks', () => ({ useMailSettings: jest.fn() }));
jest.mock('@proton/mail/store/labels/selector', () => ({
    selectActiveCategoriesTabs: jest.fn(),
    selectCategoriesLabel: jest.fn(),
}));

interface FlagOptions {
    categoryView?: boolean;
    newToolbarKillSwitch?: boolean;
}

const mockFlags = ({ categoryView = false, newToolbarKillSwitch = false }: FlagOptions = {}) => {
    jest.mocked(useFlag).mockImplementation((flag) => {
        if (flag === 'CategoryView') {
            return categoryView;
        }
        if (flag === 'NewToolbarKillSwitch') {
            return newToolbarKillSwitch;
        }
        return false;
    });
};

const mockBetaAccess = (hasBetaAccess: boolean) => {
    jest.mocked(useFeature).mockReturnValue({ feature: { Value: hasBetaAccess }, loading: false } as any);
};

describe('useCategoriesData', () => {
    beforeEach(() => {
        mockFlags();
        mockBetaAccess(false);
        jest.mocked(useFlagsStatus).mockReturnValue({ flagsReady: true } as any);
        jest.mocked(useOrganization).mockReturnValue([undefined, false] as any);
        jest.mocked(useMailSettings).mockReturnValue([{}, false] as any);
        jest.mocked(useSelector).mockReturnValue(undefined);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('shouldSeeWideToolbars', () => {
        it('is true when access comes from the CategoryView flag and the kill switch is off', () => {
            mockFlags({ categoryView: true, newToolbarKillSwitch: false });

            const { result } = renderHook(() => useCategoriesData());
            expect(result.current.shouldSeeWideToolbars).toBe(true);
        });

        it('is true when access comes from beta access and the kill switch is off', () => {
            mockFlags({ categoryView: false, newToolbarKillSwitch: false });
            mockBetaAccess(true);

            const { result } = renderHook(() => useCategoriesData());
            expect(result.current.shouldSeeWideToolbars).toBe(true);
        });

        it('is false when access is granted but the kill switch is on', () => {
            mockFlags({ categoryView: true, newToolbarKillSwitch: true });

            const { result } = renderHook(() => useCategoriesData());
            expect(result.current.shouldSeeWideToolbars).toBe(false);
        });

        it('is false when beta access is granted but the kill switch is on', () => {
            mockFlags({ categoryView: false, newToolbarKillSwitch: true });
            mockBetaAccess(true);

            const { result } = renderHook(() => useCategoriesData());
            expect(result.current.shouldSeeWideToolbars).toBe(false);
        });

        it('is false without access even when the kill switch is off', () => {
            mockFlags({ categoryView: false, newToolbarKillSwitch: false });
            mockBetaAccess(false);

            const { result } = renderHook(() => useCategoriesData());
            expect(result.current.shouldSeeWideToolbars).toBe(false);
        });

        it('is false without access when the kill switch is on', () => {
            mockFlags({ categoryView: false, newToolbarKillSwitch: true });
            mockBetaAccess(false);

            const { result } = renderHook(() => useCategoriesData());
            expect(result.current.shouldSeeWideToolbars).toBe(false);
        });
    });
});

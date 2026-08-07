import { renderHook } from '@testing-library/react-hooks';

import useFeature from '@proton/features/useFeature';
import {
    selectCategoryViewLoading,
    selectCategoryViewSettingAccess,
} from '@proton/mail/store/categoriesView/categoriesViewSelector';
import { selectActiveCategoriesTabs, selectCategoriesLabel } from '@proton/mail/store/labels/selector';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Label } from '@proton/shared/lib/interfaces';
import type { CategoryViewVariantVariant } from '@proton/unleash/UnleashFeatureFlagsVariants';
import { useFlagsStatus } from '@proton/unleash/proxy';
import { useFlag } from '@proton/unleash/useFlag';
import { useVariant } from '@proton/unleash/useVariant';

import type { CategoryTab } from './categoriesConstants';
import { CATEGORIES_COLOR_SHADES } from './categoriesConstants';
import { useCategoriesData } from './useCategoriesData';

jest.mock('@proton/features/useFeature');
jest.mock('@proton/unleash/proxy');
jest.mock('@proton/redux-shared-store/sharedProvider');
jest.mock('@proton/unleash/useFlag');
jest.mock('@proton/unleash/useVariant');

jest.mock('@proton/mail/store/labels/selector', () => ({
    selectActiveCategoriesTabs: jest.fn(),
    selectCategoriesLabel: jest.fn(),
}));

jest.mock('@proton/mail/store/categoriesView/categoriesViewSelector', () => ({
    selectCategoryViewLoading: jest.fn(),
    selectCategoryViewSettingAccess: jest.fn(),
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

const mockVariant = (name: CategoryViewVariantVariant | 'disabled' | undefined) => {
    jest.mocked(useVariant).mockReturnValue({ name } as any);
};

const PRIMARY_TAB: CategoryTab = {
    id: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
    display: true,
    notify: true,
    colorShade: CATEGORIES_COLOR_SHADES.IRIS,
};

const SOCIAL_TAB: CategoryTab = {
    id: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
    display: true,
    notify: false,
    colorShade: CATEGORIES_COLOR_SHADES.CYAN,
};

interface SelectorOptions {
    isLoading?: boolean;
    settingAccess?: boolean;
    categoriesStore?: Label[];
    activeCategoriesTabs?: CategoryTab[];
}

const mockSelectors = ({
    isLoading = false,
    settingAccess = false,
    categoriesStore = [],
    activeCategoriesTabs = [PRIMARY_TAB, SOCIAL_TAB],
}: SelectorOptions = {}) => {
    jest.mocked(useSelector).mockImplementation((selector) => {
        if (selector === selectCategoryViewLoading) {
            return isLoading;
        }
        if (selector === selectCategoryViewSettingAccess) {
            return settingAccess;
        }
        if (selector === selectCategoriesLabel) {
            return categoriesStore;
        }
        if (selector === selectActiveCategoriesTabs) {
            return activeCategoriesTabs;
        }
        return undefined;
    });
};

describe('useCategoriesData', () => {
    beforeEach(() => {
        mockFlags();
        mockBetaAccess(false);
        mockVariant('disabled');
        jest.mocked(useFlagsStatus).mockReturnValue({ flagsReady: true } as any);
        mockSelectors();
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

    describe('CategoryViewVariant access', () => {
        it.each<CategoryViewVariantVariant>([
            'FeatureAccessOn',
            'PrimaryFiltering45',
            'PrimaryFiltering60',
            'RecategorizationButton',
            'RecategorizationNoButton',
            'GradualRollout',
        ])('grants access when the variant is %s', (variant) => {
            mockFlags({ categoryView: false });
            mockBetaAccess(false);
            mockVariant(variant);

            const { result } = renderHook(() => useCategoriesData());
            expect(result.current.canUseCategoryView).toBe(true);
        });

        it.each<CategoryViewVariantVariant>(['BackBucket', 'NoAccess'])(
            'does not grant access for the %s variant',
            (variant) => {
                mockFlags({ categoryView: false });
                mockBetaAccess(false);
                mockVariant(variant);

                const { result } = renderHook(() => useCategoriesData());
                expect(result.current.canUseCategoryView).toBe(false);
            }
        );

        it('does not grant access when the variant has no name', () => {
            mockFlags({ categoryView: false });
            mockBetaAccess(false);
            mockVariant(undefined);

            const { result } = renderHook(() => useCategoriesData());
            expect(result.current.canUseCategoryView).toBe(false);
        });

        it('does not grant access when the flag is disabled', () => {
            mockFlags({ categoryView: false });
            mockBetaAccess(false);
            mockVariant('disabled');

            const { result } = renderHook(() => useCategoriesData());
            expect(result.current.canUseCategoryView).toBe(false);
        });

        it('keeps wide toolbars enabled when access comes from the variant and the kill switch is off', () => {
            mockFlags({ categoryView: false, newToolbarKillSwitch: false });
            mockBetaAccess(false);
            mockVariant('RecategorizationButton');

            const { result } = renderHook(() => useCategoriesData());
            expect(result.current.shouldSeeWideToolbars).toBe(true);
        });

        it('disables wide toolbars via the kill switch even when access comes from the variant', () => {
            mockFlags({ categoryView: false, newToolbarKillSwitch: true });
            mockBetaAccess(false);
            mockVariant('RecategorizationButton');

            const { result } = renderHook(() => useCategoriesData());
            expect(result.current.shouldSeeWideToolbars).toBe(false);
        });
    });

    /**
     * Users who already had category view before the experiment must keep it, whatever
     * bucket the experiment later puts them in. A no-access variant is therefore never
     * allowed to revoke access granted by the CategoryView flag or by beta access.
     */
    describe('variant does not revoke access granted elsewhere', () => {
        const NO_ACCESS_VARIANTS: CategoryViewVariantVariant[] = ['BackBucket', 'NoAccess'];

        it.each(NO_ACCESS_VARIANTS)('keeps CategoryView flag access on the %s variant', (variant) => {
            mockFlags({ categoryView: true });
            mockBetaAccess(false);
            mockVariant(variant);
            mockSelectors({ settingAccess: true });

            const { result } = renderHook(() => useCategoriesData());
            expect(result.current.canUseCategoryView).toBe(true);
            expect(result.current.isCategoryViewEnabled).toBe(true);
        });

        it.each(NO_ACCESS_VARIANTS)('keeps beta access on the %s variant', (variant) => {
            mockFlags({ categoryView: false });
            mockBetaAccess(true);
            mockVariant(variant);
            mockSelectors({ settingAccess: true });

            const { result } = renderHook(() => useCategoriesData());
            expect(result.current.canUseCategoryView).toBe(true);
            expect(result.current.isCategoryViewEnabled).toBe(true);
        });

        it.each(NO_ACCESS_VARIANTS)('keeps wide toolbars on the %s variant', (variant) => {
            mockFlags({ categoryView: true, newToolbarKillSwitch: false });
            mockBetaAccess(false);
            mockVariant(variant);

            const { result } = renderHook(() => useCategoriesData());
            expect(result.current.shouldSeeWideToolbars).toBe(true);
        });
    });

    describe('isCategoryViewEnabled', () => {
        it('enables the view when access comes from the variant and the setting allows it', () => {
            mockFlags({ categoryView: false });
            mockBetaAccess(false);
            mockVariant('RecategorizationButton');
            mockSelectors({ settingAccess: true });

            const { result } = renderHook(() => useCategoriesData());
            expect(result.current.isCategoryViewEnabled).toBe(true);
            expect(result.current.activeCategoriesTabs).toEqual([PRIMARY_TAB, SOCIAL_TAB]);
        });

        it('keeps the view disabled when the variant grants access but the setting does not', () => {
            mockFlags({ categoryView: false });
            mockBetaAccess(false);
            mockVariant('RecategorizationButton');
            mockSelectors({ settingAccess: false });

            const { result } = renderHook(() => useCategoriesData());
            expect(result.current.isCategoryViewEnabled).toBe(false);
            expect(result.current.activeCategoriesTabs).toEqual([]);
        });

        it('keeps the view disabled when the setting allows it but no access path grants it', () => {
            mockFlags({ categoryView: false });
            mockBetaAccess(false);
            mockVariant('NoAccess');
            mockSelectors({ settingAccess: true });

            const { result } = renderHook(() => useCategoriesData());
            expect(result.current.isCategoryViewEnabled).toBe(false);
            expect(result.current.activeCategoriesTabs).toEqual([]);
        });

        it('enables the view when access comes from the CategoryView flag and the setting allows it', () => {
            mockFlags({ categoryView: true });
            mockBetaAccess(false);
            mockVariant('disabled');
            mockSelectors({ settingAccess: true });

            const { result } = renderHook(() => useCategoriesData());
            expect(result.current.isCategoryViewEnabled).toBe(true);
            expect(result.current.activeCategoriesTabs).toEqual([PRIMARY_TAB, SOCIAL_TAB]);
        });

        it('enables the view when access comes from beta access and the setting allows it', () => {
            mockFlags({ categoryView: false });
            mockBetaAccess(true);
            mockVariant('disabled');
            mockSelectors({ settingAccess: true });

            const { result } = renderHook(() => useCategoriesData());
            expect(result.current.isCategoryViewEnabled).toBe(true);
            expect(result.current.activeCategoriesTabs).toEqual([PRIMARY_TAB, SOCIAL_TAB]);
        });
    });
});

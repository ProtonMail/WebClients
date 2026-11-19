// @vitest-environment happy-dom
import { renderHook } from '@testing-library/react';
import { useFlagsStatus } from '@unleash/proxy-client-react';

import { baseUseSelector } from '@proton/react-redux-store/ProtonStoreContext';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Label } from '@proton/shared/lib/interfaces/Label';
import { useFlag } from '@proton/unleash/useFlag';

import {
    selectCategoryViewLoading,
    selectCategoryViewSettingAccess,
} from '../../store/categoriesView/categoriesViewSelector';
import { selectActiveCategoriesTabs, selectCategoriesLabel } from '../../store/labels/selector';
import type { CategoryTab } from './categoriesConstants';
import { CATEGORIES_COLOR_SHADES } from './categoriesConstants';
import { useCategoriesData } from './useCategoriesData';

vi.mock('@unleash/proxy-client-react', () => ({ useFlagsStatus: vi.fn() }));
vi.mock('@proton/react-redux-store/ProtonStoreContext', () => ({ baseUseSelector: vi.fn() }));
vi.mock('@proton/unleash/useFlag', () => ({ useFlag: vi.fn() }));

vi.mock('../../store/labels/selector', () => ({
    selectActiveCategoriesTabs: vi.fn(),
    selectCategoriesLabel: vi.fn(),
}));

vi.mock('../../store/categoriesView/categoriesViewSelector', () => ({
    selectCategoryViewLoading: vi.fn(),
    selectCategoryViewSettingAccess: vi.fn(),
}));

interface FlagOptions {
    categoryView?: boolean;
}

const mockFlags = ({ categoryView = false }: FlagOptions = {}) => {
    vi.mocked(useFlag).mockImplementation((flag) => {
        if (flag === 'CategoryViewDisabled') {
            return !categoryView;
        }
        return false;
    });
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
    vi.mocked(baseUseSelector).mockImplementation((selector: any) => {
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
        vi.mocked(useFlagsStatus).mockReturnValue({ flagsReady: true } as any);
        mockSelectors();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('isCategoryViewEnabled', () => {
        it('keeps the view disabled when the CategoryView flag is on but the setting is off', () => {
            mockFlags({ categoryView: true });
            mockSelectors({ settingAccess: false });

            const { result } = renderHook(() => useCategoriesData());
            expect(result.current.isCategoryViewEnabled).toBe(false);
            expect(result.current.activeCategoriesTabs).toEqual([]);
        });

        it('keeps the view disabled when the setting allows it but the CategoryView flag is off', () => {
            mockFlags({ categoryView: false });
            mockSelectors({ settingAccess: true });

            const { result } = renderHook(() => useCategoriesData());
            expect(result.current.isCategoryViewEnabled).toBe(false);
            expect(result.current.activeCategoriesTabs).toEqual([]);
        });

        it('enables the view when access comes from the CategoryView flag and the setting allows it', () => {
            mockFlags({ categoryView: true });
            mockSelectors({ settingAccess: true });

            const { result } = renderHook(() => useCategoriesData());
            expect(result.current.isCategoryViewEnabled).toBe(true);
            expect(result.current.activeCategoriesTabs).toEqual([PRIMARY_TAB, SOCIAL_TAB]);
        });
    });
});

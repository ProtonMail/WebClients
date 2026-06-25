import { NavLink } from 'react-router-dom';

import { clsx } from 'clsx';

import useEventManager from '@proton/components/hooks/useEventManager';
import useLoading from '@proton/hooks/useLoading';
import { CategoryIcon } from '@proton/mail/features/categoriesView/CategoryIcon';
import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import {
    getLabelFromCategoryId,
    getTitleFromCategoryId,
} from '@proton/mail/features/categoriesView/categoriesStringHelpers';
import { useCategoriesTelemetry } from '@proton/mail/features/categoriesView/useCategoriesTelemetry';
import { wait } from '@proton/shared/lib/helpers/promise';

import { setCategoryInUrl } from 'proton-mail/helpers/mailboxUrl';

import { TabBadge } from './TabBadge';
import { TabState, categoryColorClassName } from './tabsInterface';
import { useCategoriesBadge } from './useCategoriesBadge';
import { useMarkCategorySeen } from './useMarkCategorySeen';

interface Props {
    category: CategoryTab;
    tabState: TabState;
}

const navClasses: Record<TabState, string> = {
    [TabState.ACTIVE]: 'active color-norm border-bottom border-top text-semibold mail-category-border',
    [TabState.DRAGGING_OVER]: 'hovered border mail-category-border',
    [TabState.DRAGGING_NEIGHBOR]: 'neighbor border border-transparent',
    [TabState.INACTIVE]: 'border border-transparent',
};

export const Tab = ({ category, tabState }: Props) => {
    const { call } = useEventManager();

    const { shouldShowCounter, shouldShowNewBadge } = useCategoriesBadge({ tabState, category });
    const markCategorySeen = useMarkCategorySeen();

    const { sendReportCategoriesNav } = useCategoriesTelemetry();

    const [refreshing, withRefreshing] = useLoading(false);

    const handleClick = () => {
        if (tabState === TabState.ACTIVE && !refreshing) {
            void withRefreshing(Promise.all([call(), wait(1000)]));
        }

        if (tabState !== TabState.ACTIVE) {
            sendReportCategoriesNav('tab', category.id);
        }
        sendReportCategoriesNav('tab', category.id);
        markCategorySeen(category.id);
    };

    const navigateTo = setCategoryInUrl(category.id);

    return (
        <NavLink
            to={navigateTo}
            className={clsx(
                'tab-container gap-1.5 h-full flex flex-nowrap items-center text-no-decoration color-hint hover:mail-category-color',
                navClasses[tabState]
            )}
            role="tab"
            aria-selected={tabState === TabState.ACTIVE}
            title={getTitleFromCategoryId(category.id)}
            aria-label={getLabelFromCategoryId(category.id)}
            data-testid={`category-tab-${category.id}`}
            data-color={category.colorShade}
            onClick={handleClick}
            draggable={false}
        >
            <CategoryIcon
                categoryId={category.id}
                variant="filled"
                className={clsx('shrink-0', tabState === TabState.ACTIVE && categoryColorClassName)}
            />
            <span
                title={getLabelFromCategoryId(category.id)}
                className={clsx(
                    'tag-label text-sm truncate min-w-0',
                    tabState === TabState.ACTIVE ? 'color-norm' : 'color-weak'
                )}
            >
                {getLabelFromCategoryId(category.id)}
            </span>

            <TabBadge
                category={category}
                tabState={tabState}
                shouldShowCounter={shouldShowCounter}
                shouldShowNewBadge={shouldShowNewBadge}
            />
        </NavLink>
    );
};

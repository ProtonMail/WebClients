import { NavLink } from 'react-router-dom';

import { clsx } from 'clsx';
import { c } from 'ttag';

import useEventManager from '@proton/components/hooks/useEventManager';
import useLoading from '@proton/hooks/useLoading';
import { CategoryIcon } from '@proton/mail/features/categoriesView/CategoryIcon';
import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import {
    getLabelFromCategoryId,
    getTitleFromCategoryId,
} from '@proton/mail/features/categoriesView/categoriesStringHelpers';
import { useCategoriesTelemetry } from '@proton/mail/features/categoriesView/useCategoriesTelemetry';
import { updateLastSeenEventId } from '@proton/mail/store/labels/actions';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';

import { setCategoryInUrl } from 'proton-mail/helpers/mailboxUrl';

import { useCategoriesOnboarding } from '../categoriesOnboarding/CategoriesOnboardingContext';
import { OnboardingStep } from '../categoriesOnboarding/onboardingInterface';
import { TabBadge } from './TabBadge';
import { TabState, categoryColorClassName } from './tabsInterface';
import { useCategoriesBadge } from './useCategoriesBadge';

interface Props {
    category: CategoryTab;
    tabState: TabState;
    userIsDragging: boolean;
}

const navClasses: Record<TabState, string> = {
    [TabState.ACTIVE]: 'active color-norm border-bottom border-top text-semibold mail-category-border',
    [TabState.DRAGGING_OVER]: 'hovered border mail-category-border',
    [TabState.INACTIVE]: 'border border-transparent',
};

export const Tab = ({ category, tabState, userIsDragging }: Props) => {
    const dispatch = useDispatch();
    const { call } = useEventManager();

    const { shouldShowCounter, shouldShowNewBadge, count } = useCategoriesBadge({ tabState, category });
    const { activeStep, userIsInB2COnboardingFlow } = useCategoriesOnboarding();

    const onboardingOverride =
        activeStep === OnboardingStep.MESSAGE && category.id === MAILBOX_LABEL_IDS.CATEGORY_SOCIAL;

    // During the message onboarding step, the social tab must always show a "new" badge
    const showNewBadge = onboardingOverride || shouldShowNewBadge;

    const { sendReportCategoriesNav } = useCategoriesTelemetry();

    const [refreshing, withRefreshing] = useLoading(false);

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        // We prevent the user from navigating during the onboarding
        if (userIsInB2COnboardingFlow) {
            e.preventDefault();
            return;
        }

        if (tabState === TabState.ACTIVE && !refreshing) {
            void withRefreshing(Promise.all([call(), wait(1000)]));
        }

        if (tabState !== TabState.ACTIVE) {
            sendReportCategoriesNav('tab', category.id);
        }

        void dispatch(updateLastSeenEventId({ labelID: category.id }));
    };

    const navigateTo = setCategoryInUrl(category.id);
    const shouldShowDragHelper = userIsDragging && tabState !== TabState.ACTIVE;

    return (
        <NavLink
            to={navigateTo}
            className={clsx(
                'tab-container gap-1.5 h-full flex flex-nowrap items-center text-no-decoration color-hint hover:mail-category-color',
                navClasses[tabState],
                shouldShowDragHelper && 'dashed'
            )}
            role="tab"
            aria-selected={tabState === TabState.ACTIVE}
            title={getTitleFromCategoryId(category.id)}
            aria-label={getLabelFromCategoryId(category.id)}
            data-testid={`category-tab-${category.id}`}
            data-color={tabState === TabState.ACTIVE ? category.colorShade : undefined}
            onClick={handleClick}
            draggable={false}
        >
            <span className="tab-icon relative shrink-0 flex">
                <CategoryIcon
                    categoryId={category.id}
                    variant="filled"
                    className={clsx('shrink-0', tabState === TabState.ACTIVE && categoryColorClassName)}
                />
                {showNewBadge && <span className="tab-new-dot color-blue-500" aria-hidden="true" />}
            </span>
            <span className="flex flex-column justify-center min-w-0">
                <span
                    className={clsx(
                        'tab-label text-sm text-ellipsis min-w-0',
                        tabState === TabState.ACTIVE ? 'color-norm' : 'color-weak'
                    )}
                >
                    {getLabelFromCategoryId(category.id)}
                </span>
                {shouldShowDragHelper ? (
                    <span className="tab-dragging-help text-ellipsis min-w-0 text-xs">{c('Info')
                        .t`Drag here to move message`}</span>
                ) : null}
            </span>

            <TabBadge count={count} tabState={tabState} shouldShowCounter={shouldShowCounter} />
        </NavLink>
    );
};

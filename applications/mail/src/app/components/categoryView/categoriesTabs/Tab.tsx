import { NavLink, useHistory } from 'react-router-dom';

import { clsx } from 'clsx';
import { c, msgid } from 'ttag';

import { Icon, useEventManager } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import type { CategoryTab } from '@proton/mail';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { params } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { getLabelFromCategoryId } from '../categoriesStringHelpers';
import { TabState, categoryColorClassName } from './tabsInterface';

interface Props {
    category: CategoryTab;
    tabState: TabState;
    count: number;
}

export const Tab = ({ category, count, tabState }: Props) => {
    const [mailSettings] = useMailSettings();

    const history = useHistory();
    const mailParams = useMailSelector(params);
    const { call } = useEventManager();

    const [refreshing, withRefreshing] = useLoading(false);

    const handleClick = () => {
        if (category.id === mailParams.labelID && history.location.hash === '' && !refreshing) {
            void withRefreshing(Promise.all([call(), wait(1000)]));
        }
    };

    const to = `/${LABEL_IDS_TO_HUMAN[category.id] || LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]}`;

    return (
        <NavLink
            to={to}
            className={clsx(
                'tab-container h-full flex flex-nowrap items-center text-no-decoration color-hint hover:mail-category-color',
                tabState === TabState.ACTIVE &&
                    'active color-norm border-bottom border-top text-semibold mail-category-border',
                tabState === TabState.DRAGGING_OVER && 'hovered border mail-category-border',
                tabState === TabState.DRAGGING_NEIGHBOR && 'neighbor border border-transparent',
                tabState === TabState.INACTIVE && 'border border-transparent'
            )}
            role="tab"
            aria-selected={tabState === TabState.ACTIVE}
            aria-label={getLabelFromCategoryId(category.id)}
            data-testid={`category-tab-${category.id}`}
            data-color={category.colorShade}
            onClick={handleClick}
        >
            <Icon
                className={clsx('shrink-0', tabState === TabState.ACTIVE && categoryColorClassName)}
                name={category.icon}
            />
            <span
                title={getLabelFromCategoryId(category.id)}
                className={clsx('tag-label tag-label-text', tabState === TabState.ACTIVE ? 'color-norm' : 'color-weak')}
            >
                {getLabelFromCategoryId(category.id)}
            </span>

            {category.notify && count > 0 && tabState === TabState.ACTIVE ? (
                <span
                    aria-label={
                        mailSettings.ViewMode === VIEW_MODE.GROUP
                            ? c('Label').ngettext(
                                  msgid`${count} unread conversation`,
                                  `${count} unread conversations`,
                                  count
                              )
                            : c('Label').ngettext(msgid`${count} unread message`, `${count} unread messages`, count)
                    }
                    className="tag-count px-1.5 py-0.5 text-sm mail-category-color mail-category-count-bg"
                >
                    {count}
                </span>
            ) : null}
        </NavLink>
    );
};

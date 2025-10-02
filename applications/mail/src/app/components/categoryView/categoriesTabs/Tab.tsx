import { NavLink } from 'react-router-dom';

import { clsx } from 'clsx';
import { c, msgid } from 'ttag';

import { Icon } from '@proton/components';
import type { CategoryTab } from '@proton/mail';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { getLabelFromCategoryId } from '../categoriesStringHelpers';
import { TabState } from './tabsInterface';

interface Props {
    category: CategoryTab;
    tabState: TabState;
    count: number;
}

export const Tab = ({ category, count, tabState }: Props) => {
    const [mailSettings] = useMailSettings();
    return (
        <NavLink
            to={LABEL_IDS_TO_HUMAN[category.id] || LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]}
            className={clsx(
                'tab-container flex flex-nowrap items-center text-no-decoration color-hint hover:mail-category-color',
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
        >
            <Icon
                className={clsx('shrink-0', tabState === TabState.ACTIVE && 'mail-category-color')}
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

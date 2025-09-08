import { NavLink } from 'react-router-dom';

import { clsx } from 'clsx';

import { Icon } from '@proton/components';
import type { IconName } from '@proton/icons';
import { type CategoryLabelID, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';

import type { CATEGORIES_COLOR_SHADES } from '../categoriesConstants';
import { getLabelFromCategoryId } from '../categoriesStringHelpers';
import { TabState } from './tabsInterface';

interface Props {
    id: CategoryLabelID;
    count?: number;
    icon: IconName;
    colorShade: CATEGORIES_COLOR_SHADES;
    tabState: TabState;
}

export const Tab = ({ id, count, icon, tabState, colorShade }: Props) => {
    return (
        <NavLink
            to={LABEL_IDS_TO_HUMAN[id] || LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]}
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
            aria-label={getLabelFromCategoryId(id)}
            data-testid={`category-tab-${id}`}
            data-color={colorShade}
        >
            <Icon className={clsx('shrink-0', tabState === TabState.ACTIVE && 'mail-category-color')} name={icon} />
            <span
                title={getLabelFromCategoryId(id)}
                className={clsx('tag-label tag-label-text', tabState === TabState.ACTIVE ? 'color-norm' : 'color-weak')}
            >
                {getLabelFromCategoryId(id)}
            </span>
            {/* TODO: clarify how the count is supposed to work */}
            {count && tabState === TabState.ACTIVE && (
                <span className={clsx('tag-count px-1.5 py-0.5 text-sm mail-category-color mail-category-count-bg')}>
                    {count}
                </span>
            )}
        </NavLink>
    );
};

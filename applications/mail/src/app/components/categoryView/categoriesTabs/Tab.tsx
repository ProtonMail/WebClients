import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';

import { Icon, type IconName, useTheme } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';
import clsx from '@proton/utils/clsx';

import type { CATEGORIES_COLOR_SHADES } from '../categoriesConstants';
import { getLabelFromCategoryId } from '../categoriesStringHelpers';
import { TabState } from './tabsInterface';

interface Props {
    id: MAILBOX_LABEL_IDS;
    count?: number;
    icon: IconName;
    colorShade: CATEGORIES_COLOR_SHADES;
    tabState: TabState;
}

export const Tab = ({ id, count, icon, tabState, colorShade }: Props) => {
    const theme = useTheme();

    const shadeClasses = useMemo(() => {
        return {
            border: theme.information.dark ? `border-${colorShade}-400` : `border-${colorShade}-500`,
            text: theme.information.dark ? `color-${colorShade}-400` : `color-${colorShade}-500`,
            background: theme.information.dark ? `bg-${colorShade}-900` : `bg-${colorShade}-50`,
        };
    }, [colorShade, theme.information.dark]);

    return (
        <NavLink
            to={LABEL_IDS_TO_HUMAN[id] || LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]}
            className={clsx(
                `tab-container flex flex-nowrap items-center text-no-decoration color-hint hover:${shadeClasses.text}`,
                tabState === TabState.ACTIVE &&
                    `active color-norm border-bottom border-top text-semibold ${shadeClasses.border}`,
                tabState === TabState.DRAGGING_OVER && `hovered border ${shadeClasses.border}`,
                tabState === TabState.DRAGGING_NEIGHBOR && 'neighbor border border-transparent',
                tabState === TabState.INACTIVE && 'border border-transparent'
            )}
            role="tab"
            aria-selected={tabState === 'active'}
            aria-label={getLabelFromCategoryId(id)}
            data-testid={`category-tab-${id}`}
        >
            <Icon className={clsx('shrink-0', tabState === 'active' && shadeClasses.text)} name={icon} />
            <span
                title={getLabelFromCategoryId(id)}
                className={clsx('tag-label tag-label-text', tabState === 'active' ? 'color-norm' : 'color-weak')}
            >
                {getLabelFromCategoryId(id)}
            </span>
            {/* TODO: clarify how the count is supposed to work */}
            {count && tabState === 'active' && (
                <span className={`tag-count px-1.5 py-0.5 text-sm ${shadeClasses.background} ${shadeClasses.text}`}>
                    {count}
                </span>
            )}
        </NavLink>
    );
};

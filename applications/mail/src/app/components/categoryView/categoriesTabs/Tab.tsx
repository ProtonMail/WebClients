import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';

import { Icon, type IconName, useTheme } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';
import clsx from '@proton/utils/clsx';

import type { CATEGORIES_COLOR_SHADES } from '../categoriesConstants';
import { getLabelFromCategoryId } from '../categoriesStringHelpers';
import type { TabSize } from './tabsInterface';

interface LayoutVariables {
    container: string;
    label: string;
}

const layoutVariables: Record<TabSize, LayoutVariables> = {
    default: {
        container: 'gap-2 py-3 px-6',
        label: 'text-default',
    },
    small: {
        container: 'gap-1.5 py-3 px-4',
        label: 'text-sm',
    },
    tiny: {
        container: 'gap-1.5 py-3 px-2',
        label: 'text-sm',
    },
};

interface Props {
    id: MAILBOX_LABEL_IDS;
    size?: TabSize;
    count?: number;
    icon: IconName;
    active: boolean;
    colorShade: CATEGORIES_COLOR_SHADES;
}

export const Tab = ({ id, size = 'default', count, icon, active, colorShade }: Props) => {
    const theme = useTheme();

    const classes = useMemo(() => {
        return {
            container: layoutVariables[size].container,
            label: layoutVariables[size].label,
        };
    }, [size]);

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
                classes.container,
                `tab-container flex flex-nowrap items-center text-no-decoration border-bottom hover:${shadeClasses.text}`,
                active
                    ? `text-semibold color-norm hover:color-norm ${shadeClasses.border}`
                    : 'color-hint border-transparent hover:color-weak'
            )}
            role="tab"
            aria-selected={active}
            aria-label={getLabelFromCategoryId(id)}
            data-testid={`category-tab-${id}`}
        >
            <Icon className={clsx('shrink-0', active && shadeClasses.text)} name={icon} />
            <span
                title={getLabelFromCategoryId(id)}
                className={clsx('tag-label', classes.label, active ? 'color-norm' : 'color-weak')}
            >
                {getLabelFromCategoryId(id)}
            </span>
            {/* TODO: clarify how the count is supposed to work */}
            {count && active && (
                <span className={`tag-count px-1.5 py-0.5 text-sm ${shadeClasses.background} ${shadeClasses.text}`}>
                    {count}
                </span>
            )}
        </NavLink>
    );
};

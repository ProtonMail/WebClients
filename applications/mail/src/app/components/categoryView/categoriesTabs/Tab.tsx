import { Icon, type IconName } from '@proton/components';
import clsx from '@proton/utils/clsx';

import type { CATEGORIES_COLOR_SHADES, CATEGORY_LABEL_IDS } from '../categoriesConstants';
import { getLabelFromCategoryId } from '../categoriesStringHelpers';
import type { TabSize } from './tabsInterface';

interface Props {
    id: CATEGORY_LABEL_IDS;
    size?: TabSize;
    count: number;
    icon: IconName;
    active: boolean;
    colorShade: CATEGORIES_COLOR_SHADES;
    onClick: () => void;
}

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

export const Tab = ({ id, size = 'default', count, icon, active, colorShade, onClick }: Props) => {
    // The count is not implemented yet
    const showCount = active && count > 0 && false;

    const handleClick = () => {
        onClick();
    };

    return (
        <button
            onClick={handleClick}
            className={clsx(
                'tab-container flex flex-nowrap items-center border-bottom',
                layoutVariables[size].container,
                `tab--${colorShade}`,
                active && `tab--${colorShade}--active text-semibold`,
                !active && 'color-hint border-transparent'
            )}
            role="tab"
            aria-selected={active}
            aria-label={getLabelFromCategoryId(id)}
        >
            <Icon className="shrink-0" name={icon} />
            <span title={getLabelFromCategoryId(id)} className={clsx('tag-label', layoutVariables[size].label)}>
                {getLabelFromCategoryId(id)}
            </span>
            {showCount && <span className="tag-count px-1.5 py-0.5 text-sm">{count}</span>}
        </button>
    );
};

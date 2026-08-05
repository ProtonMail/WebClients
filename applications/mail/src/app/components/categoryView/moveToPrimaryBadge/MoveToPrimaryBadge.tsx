import type { MouseEvent } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CategoryIcon } from '@proton/mail/features/categoriesView/CategoryIcon';
import { CATEGORIES_COLOR_SHADES } from '@proton/mail/features/categoriesView/categoriesConstants';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { categoryColorClassName } from '../categoriesTabs/tabsInterface';

interface Props {
    onClick: (event: MouseEvent) => void;
    className?: string;
}

export const MoveToPrimaryBadge = ({ onClick, className }: Props) => {
    return (
        <Button size="tiny" onClick={onClick} className={clsx('flex items-center gap-1', className)}>
            <CategoryIcon
                categoryId={MAILBOX_LABEL_IDS.CATEGORY_DEFAULT}
                variant="filled"
                colorShade={CATEGORIES_COLOR_SHADES.IRIS}
                className={categoryColorClassName}
            />
            <span>{c('Info').t`Move to Primary`}</span>
        </Button>
    );
};

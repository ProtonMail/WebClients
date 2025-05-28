import { c } from 'ttag';

import { Icon } from '@proton/components'
import { Tooltip } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

import { isUnread } from '../../helpers/elements';
import type { Element } from '../../models/element';

interface Props {
    element: Element | undefined;
    labelID: string;
    className?: string;
    isSelected?: boolean;
}

const ItemUnread = ({ element, labelID, className, isSelected }: Props) => {
    const unread = isUnread(element, labelID);

    if (!unread) {
        return null;
    }

    return (
        <Tooltip title={c('Alt').t`Unread email`}>
            <span className={clsx('flex items-center shrink-0 z-1', className)}>
                <Icon
                    name="circle-filled"
                    size={3}
                    className={!isSelected ? 'color-primary' : undefined}
                    alt={c('Alt').t`Unread email`}
                />
            </span>
        </Tooltip>
    );
};

export default ItemUnread;

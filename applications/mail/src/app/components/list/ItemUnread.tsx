import { c } from 'ttag';

import { Icon, Tooltip } from '@proton/components';

import { isUnread } from '../../helpers/elements';
import { Element } from '../../models/element';

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
            <span className={className}>
                <Icon name="circle-filled" size={12} className={!isSelected ? 'color-primary' : undefined} />
            </span>
        </Tooltip>
    );
};

export default ItemUnread;

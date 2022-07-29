import { Icon } from '@proton/components';

import { isUnread } from '../../helpers/elements';
import { Element } from '../../models/element';

interface Props {
    element: Element | undefined;
    labelID: string;
    className?: string;
}

const ItemUnread = ({ element, labelID, className }: Props) => {
    const unread = isUnread(element, labelID);

    if (!unread) {
        return null;
    }

    return (
        <span className={className}>
            <Icon name="circle-filled" size={12} className="color-primary" />
        </span>
    );
};

export default ItemUnread;

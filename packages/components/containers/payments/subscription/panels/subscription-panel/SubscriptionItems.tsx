import Icon from '@proton/components/components/icon/Icon';
import StripedItem from '@proton/components/components/stripedList/StripedItem';
import clsx from '@proton/utils/clsx';

import type { Item } from './Item';

interface Props {
    items: Item[];
}

export const SubscriptionItems = ({ items }: Props) => {
    return (
        <>
            {items.map(
                ({
                    icon = 'checkmark',
                    text,
                    included = true,
                    status = 'available',
                    tooltip,
                    actionElement,
                    dataTestId,
                }) => {
                    if (!included) {
                        return null;
                    }

                    const key = typeof text === 'string' ? text : `${tooltip}-${icon}-${included}-${status}`;

                    return (
                        <StripedItem
                            key={key}
                            className={clsx(status === 'coming-soon' && 'color-weak')}
                            left={<Icon className={clsx(included && 'color-success')} size={5} name={icon} />}
                        >
                            <div className="flex justify-space-between items-baseline" data-testid={dataTestId}>
                                <span>{text}</span>
                                {actionElement}
                            </div>
                        </StripedItem>
                    );
                }
            )}
        </>
    );
};

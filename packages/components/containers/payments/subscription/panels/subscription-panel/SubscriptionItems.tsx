import { Icon, Info, StripedItem } from '@proton/components';
import { type UserModel } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import { getProtonPassFeatureLifetime } from '../../../features/pass';
import type { Item } from './Item';

interface Props {
    items: Item[];
    user: UserModel;
}

export const SubscriptionItems = ({ items, user }: Props) => {
    const alwaysPresentItems = [
        user.hasPassLifetime && {
            ...getProtonPassFeatureLifetime(),
            actionElement: undefined,
            dataTestId: undefined,
        },
    ].filter(isTruthy);
    const allItems = [...alwaysPresentItems, ...items];

    return (
        <>
            {allItems.map(
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
                                <span>
                                    {text}
                                    {tooltip && <Info className="align-middle ml-2" title={tooltip} />}
                                </span>
                                {actionElement}
                            </div>
                        </StripedItem>
                    );
                }
            )}
        </>
    );
};

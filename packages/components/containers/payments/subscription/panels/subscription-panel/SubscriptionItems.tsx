import { c } from 'ttag';

import { Badge } from '@proton/components/components/badge/Badge';
import Icon from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';
import StripedItem from '@proton/components/components/stripedList/StripedItem';
import type { UserModel } from '@proton/shared/lib/interfaces';
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
                    isAddon,
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
                            <div
                                className="flex justify-space-between items-baseline flex-nowrap"
                                data-testid={dataTestId}
                            >
                                <span>
                                    {text}
                                    {tooltip && <Info className="align-middle ml-2" title={tooltip} />}
                                    {isAddon && <Badge type="origin" className="ml-2">{c('Addon').t`Add-on`}</Badge>}
                                </span>
                                <span className="shrink-0">{actionElement}</span>
                            </div>
                        </StripedItem>
                    );
                }
            )}
        </>
    );
};

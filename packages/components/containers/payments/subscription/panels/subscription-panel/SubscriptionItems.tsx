import { c } from 'ttag';

import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import type { UserModel } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import { Badge } from '../../../../../components/badge/Badge';
import Info from '../../../../../components/link/Info';
import StripedItem from '../../../../../components/stripedList/StripedItem';
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
                    id,
                    icon: FeatureIcon = IcCheckmark,
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

                    return (
                        <StripedItem
                            key={id}
                            className={clsx(status === 'coming-soon' && 'color-weak')}
                            left={<FeatureIcon className={clsx(included && 'color-success')} size={5} />}
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

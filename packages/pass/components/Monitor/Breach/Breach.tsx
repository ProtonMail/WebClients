import { type FC } from 'react';
import { Redirect, type RouteChildrenProps } from 'react-router-dom';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { useMonitor } from '@proton/pass/components/Monitor/MonitorContext';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { itemEq } from '@proton/pass/lib/items/item.predicates';
import { AddressType } from '@proton/pass/lib/monitor/types';

import { BreachDetails } from './Item/BreachDetails';

type Props = RouteChildrenProps<{ type: AddressType; addressId: string }>;

export const Breach: FC<Props> = ({ match }) => {
    const { breaches, didLoad } = useMonitor();

    const breach = (() => {
        switch (match?.params.type) {
            case AddressType.PROTON:
                return breaches.data.proton.find((breach) => breach.addressId === match.params.addressId);
            case AddressType.CUSTOM:
                return breaches.data.custom.find((breach) => breach.addressId === match.params.addressId);
            case AddressType.ALIAS:
                const [shareId, itemId] = match?.params.addressId?.split(':') || [];
                return breaches.data.alias.find(itemEq({ shareId, itemId }));
        }
    })();

    if (breach) return <BreachDetails {...breach} />;
    else if (!didLoad) return <CircleLoader size="small" />;
    else return <Redirect to={getLocalPath('monitor/dark-web')} push={false} />;
};

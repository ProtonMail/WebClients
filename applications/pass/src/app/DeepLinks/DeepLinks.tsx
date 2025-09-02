import type { FC } from 'react';
import { Redirect, type RouteChildrenProps, useParams } from 'react-router-dom';

import { UpsellRef } from '@proton/pass/constants';
import { useNavigateToUpgrade } from '@proton/pass/hooks/useNavigateToUpgrade';

import { DEEPLINK_CONFIG, getDeeplinkFallbackURL, getDeeplinkURLPrefix } from './configuration';
import type { DeepLinkRoutes } from './types';

export const DeepLinks: FC<RouteChildrenProps> = ({ match, location }) => {
    const path = match?.path ?? '';
    const { key } = useParams<{ key: keyof DeepLinkRoutes }>();
    const params = new URLSearchParams(location.search);

    const navigateToUpgrade = useNavigateToUpgrade({
        upsellRef: UpsellRef.DEFAULT,
        coupon: params.get('Coupon'),
    });

    /* Redirect to external link when 'upgrade' event is received */
    if (key === 'upgrade') navigateToUpgrade();

    const config = DEEPLINK_CONFIG[key] || getDeeplinkFallbackURL;
    const targetUrl = `${getDeeplinkURLPrefix(path)}${config(params)}`;

    return <Redirect to={targetUrl} />;
};

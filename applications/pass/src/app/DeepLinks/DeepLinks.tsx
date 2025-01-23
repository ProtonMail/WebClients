import { type FC, useMemo } from 'react';
import { Redirect, type RouteChildrenProps, useParams } from 'react-router-dom';

import { UpsellRef } from '@proton/pass/constants';
import { useNavigateToUpgrade } from '@proton/pass/hooks/useNavigateToUpgrade';

import { DEEPLINK_CONFIG, fallback, getURLPrefix } from './configuration';
import type { DeepLinkRoutes } from './types';

export const DeepLinks: FC<RouteChildrenProps> = ({ match, location }) => {
    const navigateToUpgrade = useNavigateToUpgrade({ upsellRef: UpsellRef.DEFAULT });
    const { key } = useParams<{ key: keyof DeepLinkRoutes }>();
    const path = match?.path ?? '';

    // Redirect to external link when 'upgrade' event is received
    if (key === 'upgrade') navigateToUpgrade();

    const targetUrl = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const config = DEEPLINK_CONFIG[key] || fallback;
        return `${getURLPrefix(path)}${config(params)}`;
    }, [key, location, match]);

    return <Redirect to={targetUrl} />;
};

import { type ComponentPropsWithoutRef, Suspense, lazy } from 'react';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import { useIsB2BTrial } from '@proton/payments/ui';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { NEWSLETTER_SUBSCRIPTIONS_BITS } from '@proton/shared/lib/helpers/newsletter';

import type TopNavbarOffer from './TopNavbarOffer';
import TopNavbarUpgradeButton from './TopNavbarUpgradeButton';

interface Props {
    offerProps?: Omit<ComponentPropsWithoutRef<typeof TopNavbarOffer>, 'offerConfig' | 'app'>;
    app: APP_NAMES;
}

const LazyTopNavbarUpsellInner = lazy(
    () => import(/* webpackChunkName: "TopNavbarUpsellInner" */ './TopNavbarUpsellInner')
);

const TopNavbarUpsell = ({ app, offerProps }: Props) => {
    const [subscription] = useSubscription();
    const [organization] = useOrganization();
    const [userSettings, loadingUserSettings] = useUserSettings();

    // don't upsell during B2B trial
    const isB2BTrial = useIsB2BTrial(subscription, organization);

    if (isB2BTrial || loadingUserSettings) {
        return null;
    }

    // We only show paid offers if the in-app notification flag is enabled
    if (hasBit(userSettings.News, NEWSLETTER_SUBSCRIPTIONS_BITS.IN_APP_NOTIFICATIONS)) {
        return (
            <ErrorBoundary component={null}>
                <Suspense fallback={null}>
                    <LazyTopNavbarUpsellInner app={app} offerProps={offerProps} />
                </Suspense>
            </ErrorBoundary>
        );
    }

    // The upgrade button can still be shown (it has its own condition to be shown for free users)
    return <TopNavbarUpgradeButton app={app} />;
};

export default TopNavbarUpsell;

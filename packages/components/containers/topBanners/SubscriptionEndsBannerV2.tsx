import { differenceInDays, fromUnixTime } from 'date-fns';
import { c, msgid } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { Banner, ButtonLike } from '@proton/atoms';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { REACTIVATE_SOURCE } from '@proton/components/containers/payments/subscription/cancellationFlow/useCancellationTelemetry';
import useConfig from '@proton/components/hooks/useConfig';
import { getAppShortName } from '@proton/shared/lib/apps/helper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { hasVPN } from '@proton/shared/lib/helpers/subscription';
import { hasVPN2024 } from '@proton/shared/lib/helpers/subscription';

import { subscriptionExpires } from '../payments/subscription/helpers';

const SubscriptionEndsBannerV2 = ({ app }: { app: APP_NAMES }) => {
    const { APP_NAME } = useConfig();
    const [subscription] = useSubscription();
    const { subscriptionExpiresSoon, planName, expirationDate } = subscriptionExpires(subscription!);

    if (!([APPS.PROTONACCOUNT, APPS.PROTONVPN_SETTINGS] as APP_NAMES[]).includes(APP_NAME)) {
        return null;
    }

    if (!subscriptionExpiresSoon || !subscription) {
        return null;
    }

    const daysLeft = differenceInDays(fromUnixTime(expirationDate), new Date());

    const daysLeftPluralString = c('Info').ngettext(
        msgid`${planName} expires in ${daysLeft} day.`,
        `${planName} expires in ${daysLeft} days.`,
        daysLeft
    );

    const daysLeftString = daysLeft > 0 ? daysLeftPluralString : c('Info').t`${planName} expires today.`;

    const urgent = daysLeft < 10;

    const appName = getAppShortName(app);

    const getBannerCopy = () => {
        switch (true) {
            case Boolean(hasVPN(subscription) || hasVPN2024(subscription)):
                return urgent
                    ? c('Info').t`Don't lose access to your premium ${appName} features. Enable auto-renew today.`
                    : c('Info').t`Enable auto-renew to keep access to Plus servers and features.`;
            default:
                return urgent
                    ? c('Info').t`Don't lose access to your premium features. Enable auto-renew today.`
                    : c('Info').t`Enable auto-renew to keep access to your premium features.`;
        }
    };

    const reactivateLink = (
        <ButtonLike
            as={SettingsLink}
            color="danger"
            size="small"
            data-testid="reactivate-link"
            key="reactivate-subscription"
            path={`/subscription?source=${REACTIVATE_SOURCE.banners}#your-subscriptions`}
        >{c('Link').t`Reactivate now`}</ButtonLike>
    );

    return (
        <Banner variant={urgent ? 'danger-outline' : undefined} action={reactivateLink}>
            <b className={urgent ? 'color-danger' : undefined}>{daysLeftString}</b> {getBannerCopy()}
        </Banner>
    );
};

export default SubscriptionEndsBannerV2;

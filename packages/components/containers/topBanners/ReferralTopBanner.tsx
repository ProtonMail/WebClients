import { c } from 'ttag';
import { fromUnixTime, format } from 'date-fns';
import { APPS } from '@proton/shared/lib/constants';
import { dateLocale } from '@proton/shared/lib/i18n';
import { isTrial, isTrialExpired, willTrialExpire } from '@proton/shared/lib/helpers/subscription';
import { useSubscription, useConfig } from '../../hooks';
import TopBanner from './TopBanner';
import { SettingsLink } from '../../components';

const ReferralTopBanner = () => {
    const [subscription, loadingSubscription] = useSubscription();
    const { APP_NAME } = useConfig();
    const isVpn = APP_NAME === APPS.PROTONVPN_SETTINGS;

    if (loadingSubscription) {
        return null;
    }

    if (isVpn) {
        return null;
    }

    const { PeriodEnd = 0 } = subscription;
    const trial = isTrial(subscription);
    const willExpire = willTrialExpire(subscription);
    const isExpired = isTrialExpired(subscription);
    const textAction = c('Button').t`Continue using ProtonMail.`;
    const action = (
        <SettingsLink key="continue" className="color-inherit" path="/dashboard?plan=plus">
            {textAction}
        </SettingsLink>
    );
    const textDate = format(fromUnixTime(PeriodEnd), 'MMMM d yyyy', { locale: dateLocale });

    if (!trial) {
        return null;
    }

    // 1 week before the trial ends
    if (willExpire) {
        const message = c('Warning').jt`Your free trial ends on ${textDate}. ${action}`;
        return <TopBanner className="bg-warning">{message}</TopBanner>;
    }

    // Trial has ended
    if (isExpired) {
        const message = c('Message')
            .jt`Your free trial has ended. Access to your account will soon be disabled. ${action}`;
        return <TopBanner className="bg-danger">{message}</TopBanner>;
    }

    // In trial
    return null;
};

export default ReferralTopBanner;

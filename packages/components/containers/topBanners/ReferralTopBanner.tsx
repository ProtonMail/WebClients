import { format, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { APPS, MAIL_APP_NAME, OPEN_OFFER_MODAL_EVENT } from '@proton/shared/lib/constants';
import { isTrial, isTrialExpired, willTrialExpire } from '@proton/shared/lib/helpers/subscription';
import { dateLocale } from '@proton/shared/lib/i18n';

import { InlineLinkButton } from '../../components';
import { useConfig, useSubscription } from '../../hooks';
import TopBanner from './TopBanner';

const ReferralTopBanner = () => {
    const [subscription, loadingSubscription] = useSubscription();
    const protonConfig = useConfig();
    const isVpn = protonConfig.APP_NAME === APPS.PROTONVPN_SETTINGS;
    const trial = isTrial(subscription);
    const { PeriodEnd = 0 } = subscription;
    const willExpire = willTrialExpire(subscription);
    const isExpired = isTrialExpired(subscription);
    const textAction = c('Button').t`Continue using ${MAIL_APP_NAME}.`;
    const handleClick = () => document.dispatchEvent(new CustomEvent(OPEN_OFFER_MODAL_EVENT));
    const action = (
        <InlineLinkButton key="continue" className="color-inherit" onClick={handleClick}>
            {textAction}
        </InlineLinkButton>
    );
    const textDate = format(fromUnixTime(PeriodEnd), 'PPP', { locale: dateLocale });

    if (loadingSubscription || !trial || isVpn) {
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

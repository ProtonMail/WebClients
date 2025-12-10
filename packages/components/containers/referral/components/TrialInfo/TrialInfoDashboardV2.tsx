import { format, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { Banner } from '@proton/atoms/Banner/Banner';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { PLANS, PLAN_NAMES, getPlanTitle, isAutoRenewTrial } from '@proton/payments';
import { isReferralTrial, isTrialRenewing } from '@proton/payments/core/subscription/helpers';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { dateLocale } from '@proton/shared/lib/i18n';
import useFlag from '@proton/unleash/useFlag';

const TrialInfoDashboardV2 = () => {
    const [subscription] = useSubscription();
    const [referralInfo] = useReferralInfo();
    const { referrerRewardAmount } = referralInfo.uiData;
    const isReferralExpansionEnabled = useFlag('ReferralExpansion');

    const { PeriodEnd = 0 } = subscription || {};
    const textDate = format(fromUnixTime(PeriodEnd), 'PPP', { locale: dateLocale });
    const planTitle = getPlanTitle(subscription) || c('Referral').t`your subscription`;

    if (!isReferralExpansionEnabled || !isReferralTrial(subscription)) {
        return null;
    }

    return (
        <Banner variant="info">
            <div>
                <strong>{c('Referral').t`How your free trial works:`}</strong>{' '}
                <span className="color-norm">
                    {getBoldFormattedText(c('Referral').t`Enjoy **${planTitle}** for free until **${textDate}**.`)}
                </span>{' '}
                {!isAutoRenewTrial(subscription) ? (
                    <span className="color-norm">
                        {getBoldFormattedText(
                            c('Referral')
                                .t`If you subscribe before this date, you’ll get **${referrerRewardAmount}** in credits. If you don’t subscribe, you’ll be downgraded to ${BRAND_NAME} ${PLAN_NAMES[PLANS.FREE]}.`
                        )}
                    </span>
                ) : null}
                {isAutoRenewTrial(subscription) && isTrialRenewing(subscription) ? (
                    <span className="color-norm">
                        {getBoldFormattedText(
                            c('Referral')
                                .t`If you cancel before then, you will be downgraded to ${BRAND_NAME} ${PLAN_NAMES[PLANS.FREE]} when the trial ends. If you don’t cancel, your full plan will start and you’ll get **${referrerRewardAmount}** in credits.`
                        )}
                    </span>
                ) : null}
            </div>
        </Banner>
    );
};

export default TrialInfoDashboardV2;

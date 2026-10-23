import { format, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { Banner } from '@proton/atoms/Banner/Banner';
import { useReferralTrialSubscription } from '@proton/payments-ui/ui/hooks/useReferralTrialSubscription';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { getPlanTitle, isAutoRenewTrial, isTrialRenewing } from '@proton/payments/core/subscription/helpers';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { dateLocale } from '@proton/shared/lib/i18n';

import getBoldFormattedText from '../../../../helpers/getBoldFormattedText';

const ReferralTrialInfoDashboardV2 = () => {
    const [referralTrialSubscription] = useReferralTrialSubscription();
    const [referralInfo] = useReferralInfo();
    const { referrerRewardAmount } = referralInfo.uiData;

    if (!referralTrialSubscription) {
        return null;
    }

    const textDate = format(fromUnixTime(referralTrialSubscription.PeriodEnd), 'PPP', { locale: dateLocale });
    const planTitle = getPlanTitle(referralTrialSubscription) || c('Referral').t`your subscription`;

    return (
        <Banner variant="info">
            <div>
                <strong>{c('Referral').t`How your free trial works:`}</strong>{' '}
                <span className="color-norm">
                    {getBoldFormattedText(c('Referral').t`Enjoy **${planTitle}** for free until **${textDate}**.`)}
                </span>{' '}
                {!isAutoRenewTrial(referralTrialSubscription) ? (
                    <span className="color-norm">
                        {getBoldFormattedText(
                            c('Referral')
                                .t`If you subscribe before this date, you’ll get **${referrerRewardAmount}** in credits. If you don’t subscribe, you’ll be downgraded to ${BRAND_NAME} ${PLAN_NAMES[PLANS.FREE]}.`
                        )}
                    </span>
                ) : null}
                {isAutoRenewTrial(referralTrialSubscription) && isTrialRenewing(referralTrialSubscription) ? (
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

export default ReferralTrialInfoDashboardV2;

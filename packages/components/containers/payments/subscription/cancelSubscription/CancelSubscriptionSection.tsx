import { c } from 'ttag';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import { usePaymentMethods } from '@proton/account/paymentMethods/hooks';
import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { getCancellableSubscriptions } from '@proton/payments/core/subscription/cancellable-subscriptions';
import { getSubscriptionPlanTitle, isManagedExternally } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { getTrialInfoForSingleSubscription } from '@proton/payments/core/trials';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';

import { Badge } from '../../../../components/badge/Badge';
import DropdownMenu from '../../../../components/dropdown/DropdownMenu';
import DropdownMenuButton from '../../../../components/dropdown/DropdownMenuButton';
import SimpleDropdown from '../../../../components/dropdown/SimpleDropdown';
import { DropdownSizeUnit } from '../../../../components/dropdown/utils';
import getBoldFormattedText from '../../../../helpers/getBoldFormattedText';
import SettingsParagraph from '../../../account/SettingsParagraph';
import SettingsSection from '../../../account/SettingsSection';
import credits from '../../../referral/components/ReferralTrialInfo/credits.svg';
import { getSubscriptionManagerName } from '../InAppPurchaseModal';
import { useStartCancellation } from './useStartCancellation';

const getCancellationText = ({
    isB2BTrial,
    isReferralTrial,
    hasPaymentMethod,
}: {
    isB2BTrial: boolean;
    isReferralTrial: boolean;
    hasPaymentMethod: boolean;
}) => {
    if (isB2BTrial) {
        return hasPaymentMethod
            ? c('b2b_trials_2025_Info')
                  .t`When you cancel, your free trial won’t be converted to a paid subscription, but you can still enjoy plan benefits until the end of the trial period. After that, you will be downgraded to the ${BRAND_NAME} Free plan.`
            : c('b2b_trials_2025_Info')
                  .t`When you cancel, your free trial won’t be converted to a paid subscription, but you can still enjoy plan benefits until the end of the trial period.`;
    }
    if (isReferralTrial) {
        return c('Info')
            .t`When you cancel, your subscription won't start, but you can still enjoy plan benefits until the end of the trial period. After that, you will be downgraded to the ${BRAND_NAME} Free plan.`;
    }
    return c('Info')
        .t`When you cancel, your subscription won't be renewed, but you can still enjoy plan benefits until the end of the subscription period. After that, you will be downgraded to the ${BRAND_NAME} Free plan.`;
};

const getOneOfSeveralCancellationNote = (subscription: Subscription, isB2BTrial: boolean, isReferralTrial: boolean) => {
    if (isManagedExternally(subscription)) {
        return c('Info').t`You cancel it in the store.`;
    }
    if (isB2BTrial) {
        return c('b2b_trials_2025_Info').t`When you cancel, your free trial won’t be converted to a paid subscription.`;
    }
    if (isReferralTrial) {
        return c('Info').t`When you cancel, your subscription won't start after the trial period.`;
    }
    return null;
};

const getCancelSubscriptionLabel = (planTitle: string | undefined, isTrial: boolean) => {
    if (!planTitle) {
        return c('Action subscription').t`Cancel subscription`;
    }
    return isTrial ? c('Action').t`Cancel ${planTitle} trial` : c('Action').t`Cancel ${planTitle}`;
};

const useCreditRewardWarning = (isReferralTrial: boolean) => {
    const [referralInfo] = useReferralInfo();
    const { referrerRewardAmount } = referralInfo.uiData;

    if (!isReferralTrial) {
        return null;
    }
    return getBoldFormattedText(
        c('Referral').t`If you cancel, you will lose your **${referrerRewardAmount}** credit reward.`
    );
};

const PassLifetimeNotice = () => {
    const [user] = useUser();

    if (!user.hasPassLifetime) {
        return null;
    }

    return (
        <SettingsParagraph>
            {c('Info')
                .t`You will keep lifetime access to ${PASS_APP_NAME} + SimpleLogin premium features if you cancel your subscription.`}
        </SettingsParagraph>
    );
};

const CancelTheOnlySubscription = ({ app, subscription }: { app: APP_NAMES; subscription: Subscription }) => {
    const [user] = useUser();
    const { startCancellation, modals, loading } = useStartCancellation({ app });
    const [paymentMethods, loadingPaymentMethods] = usePaymentMethods();
    const [entitlementCatalog] = useEntitlementCatalog();
    const { isTrial, isB2BTrial, isReferralTrial } = getTrialInfoForSingleSubscription(
        entitlementCatalog,
        subscription
    );
    const creditRewardWarning = useCreditRewardWarning(isReferralTrial);
    const { planTitle } = getSubscriptionPlanTitle(user, subscription);

    if (loading || loadingPaymentMethods) {
        return null;
    }

    const cancellationText = getCancellationText({
        isB2BTrial,
        isReferralTrial,
        hasPaymentMethod: !!paymentMethods?.length,
    });

    return (
        <>
            {modals}
            <SettingsSection>
                <SettingsParagraph>{cancellationText}</SettingsParagraph>
                <PassLifetimeNotice />
                {creditRewardWarning && (
                    <div className="flex gap-3 mb-6">
                        <img src={credits} alt="" />
                        <p>{creditRewardWarning}</p>
                    </div>
                )}
                <Button
                    onClick={() => startCancellation(subscription)}
                    data-testid="CancelSubscriptionButton"
                    shape="outline"
                >
                    {getCancelSubscriptionLabel(planTitle, isTrial)}
                </Button>
            </SettingsSection>
        </>
    );
};

const CancelSubscriptionMenuItem = ({ subscription, onClick }: { subscription: Subscription; onClick: () => void }) => {
    const [user] = useUser();
    const [entitlementCatalog] = useEntitlementCatalog();
    const { isTrial, isB2BTrial, isReferralTrial } = getTrialInfoForSingleSubscription(
        entitlementCatalog,
        subscription
    );
    const creditRewardWarning = useCreditRewardWarning(isReferralTrial);
    const { planTitle } = getSubscriptionPlanTitle(user, subscription);
    const note = getOneOfSeveralCancellationNote(subscription, isB2BTrial, isReferralTrial);

    const label = getCancelSubscriptionLabel(planTitle, isTrial);

    return (
        <DropdownMenuButton className="text-left" onClick={onClick}>
            <span className="flex items-center gap-2">
                <span className="text-semibold">{label}</span>
                {isManagedExternally(subscription) && (
                    <Badge type="light" className="text-nowrap" data-testid="subscriptionStoreBadge">
                        {getSubscriptionManagerName(subscription.External)}
                    </Badge>
                )}
            </span>
            {note && <span className="block text-sm color-weak">{note}</span>}
            {creditRewardWarning && <span className="block text-sm color-weak">{creditRewardWarning}</span>}
        </DropdownMenuButton>
    );
};

const CancelOneOfSeveralSubscriptions = ({ app, subscriptions }: { app: APP_NAMES; subscriptions: Subscription[] }) => {
    const { startCancellation, modals, loading } = useStartCancellation({ app });

    return (
        <>
            {modals}
            <SettingsSection>
                <SettingsParagraph>
                    {c('Info')
                        .t`You have several subscriptions. Choose the one to cancel: your other subscriptions aren't affected. A cancelled subscription won't be renewed, and you keep its benefits until the end of the subscription period.`}
                </SettingsParagraph>
                <PassLifetimeNotice />
                <SimpleDropdown
                    as={Button}
                    shape="outline"
                    originalPlacement="bottom-start"
                    dropdownSize={{ width: '24em', maxWidth: DropdownSizeUnit.Viewport }}
                    content={c('Action subscription').t`Cancel subscription`}
                    disabled={loading}
                    data-testid="CancelSubscriptionButton"
                >
                    <DropdownMenu>
                        {subscriptions.map((subscription) => (
                            <CancelSubscriptionMenuItem
                                key={subscription.ID}
                                subscription={subscription}
                                onClick={() => startCancellation(subscription)}
                            />
                        ))}
                    </DropdownMenu>
                </SimpleDropdown>
            </SettingsSection>
        </>
    );
};

export const CancelSubscriptionSection = ({ app }: { app: APP_NAMES }) => {
    const [allSubscriptions = [], loadingAllSubscriptions] = useAllSubscriptions();

    if (loadingAllSubscriptions) {
        return null;
    }

    const cancellableSubscriptions = getCancellableSubscriptions(allSubscriptions);
    if (cancellableSubscriptions.length === 0) {
        return null;
    }
    if (cancellableSubscriptions.length > 1) {
        return <CancelOneOfSeveralSubscriptions app={app} subscriptions={cancellableSubscriptions} />;
    }

    return <CancelTheOnlySubscription app={app} subscription={cancellableSubscriptions[0]} />;
};

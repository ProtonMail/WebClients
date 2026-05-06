import { c } from 'ttag';

import { SafetyReviewCta } from '@proton/account/safetyReview/components/SafetyReviewCta';
import type { SafetyReviewAllProps } from '@proton/account/safetyReview/components/interface';
import type { ExtractRecoveryActionItem } from '@proton/account/safetyReview/recoveryState/recoveryState';
import { Href } from '@proton/atoms/Href/Href';
import { PromotionButton } from '@proton/components/components/button/PromotionButton';
import SubscriptionModalProvider, {
    useSubscriptionModal,
} from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { PaymentsContextProvider } from '@proton/payments/ui';
import { APP_UPSELL_REF_PATH, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

import illustration from '../../assets/recovery-emergency-contacts.svg';
import { SafetyReviewCardHeader } from '../../cards/SafetyReviewCardHeader';

type Props = SafetyReviewAllProps & {
    recoveryItem: ExtractRecoveryActionItem<'upsellEmergencyContacts'>;
};
export const BaseUpsellEmergencyContacts = (props: Props) => {
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();

    const handleUpsell = () => {
        const upsellRef = getUpsellRef({
            app: APP_UPSELL_REF_PATH.ACCOUNT_UPSELL_REF_PATH,
            component: UPSELL_COMPONENT.MODAL,
            feature: SHARED_UPSELL_PATHS.EMERGENCY_ACCESS,
        });

        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            metrics: { source: 'upsells' },
            upsellRef,
            disableThanksStep: true,
            onSubscribed: () => {
                props.safetyReview.actions.next('completed', props.recoveryItem);
            },
        }).catch(noop);
    };

    return (
        <form
            id={props.firstItemId}
            onSubmit={(event) => {
                event.preventDefault();
                props.safetyReview.actions.next('skipped', props.recoveryItem);
            }}
        >
            <SafetyReviewCardHeader>
                <SafetyReviewCardHeader.Illustration>
                    <img src={illustration} alt="" width={64} height={64} />
                </SafetyReviewCardHeader.Illustration>
                <SafetyReviewCardHeader.Title>
                    {c('safety_review').t`Protect your legacy with Emergency Access`}
                </SafetyReviewCardHeader.Title>
                <SafetyReviewCardHeader.Description>
                    {c('safety_review')
                        .t`Upgrade your plan to enable Emergency Access to your account. This will allow you to designate 1 to 5 people who will be able to reset your password for you.`}
                </SafetyReviewCardHeader.Description>
                <SafetyReviewCardHeader.Description>
                    <Href href={getKnowledgeBaseUrl('/emergency-access')}>{c('Link').t`Learn more`}</Href>
                </SafetyReviewCardHeader.Description>
            </SafetyReviewCardHeader>

            <PromotionButton
                iconName="upgrade"
                loading={loadingSubscriptionModal}
                onClick={() => {
                    handleUpsell();
                }}
                size="large"
                pill
                className="mx-auto"
            >
                {c('emergency_access').t`Explore plans`}
            </PromotionButton>

            <SafetyReviewCta {...props} cta={c('safety_review').t`Got it`} />
        </form>
    );
};

export const UpsellEmergencyContacts = (props: Props) => {
    return (
        <SubscriptionModalProvider app={props.safetyReview.state.backLink.appName}>
            <PaymentsContextProvider>
                <BaseUpsellEmergencyContacts {...props} />
            </PaymentsContextProvider>
        </SubscriptionModalProvider>
    );
};

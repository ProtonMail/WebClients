import { c } from 'ttag';

import { useMembers } from '@proton/account/members/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { InlineLinkButton } from '@proton/atoms';
import { SUBSCRIPTION_STEPS, SettingsParagraph, useSubscriptionModal } from '@proton/components';
import { BRAND_NAME, MEMBER_SUBSCRIBER } from '@proton/shared/lib/constants';
import { getHasExternalMemberCapableB2BPlan, getHasInboxB2BPlan } from '@proton/shared/lib/helpers/subscription';

const AddMoreScribeSeat = () => {
    const [user] = useUser();
    const [members] = useMembers();
    const [subscription] = useSubscription();
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();

    const selfMember = members?.find((member) => member.Self);
    const hasExternalMemberCapableB2BPlan = getHasExternalMemberCapableB2BPlan(subscription);
    const hasInboxB2BPlan = getHasInboxB2BPlan(subscription);

    const canShowButton =
        (hasExternalMemberCapableB2BPlan || hasInboxB2BPlan) &&
        user.canPay &&
        selfMember?.Subscriber === MEMBER_SUBSCRIBER.PAYER;
    if (!canShowButton) {
        return null;
    }

    const handleGetMoreLicense = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            disablePlanSelection: true,
            metrics: {
                /**
                 * The `vpn` in `vpn-um-get-more` is unimportant.
                 * The intention is to observe the user journey, not the specific plan the journey is for.
                 * However changing this would require a new metric schema version.
                 */
                source: 'vpn-um-get-more',
            },
        });
    };

    return (
        <SettingsParagraph className="text-cut">
            <InlineLinkButton
                className="color-inherit"
                onClick={handleGetMoreLicense}
                disabled={loadingSubscriptionModal}
            >
                {c('Action').t`Add more ${BRAND_NAME} Scribe seats`}
            </InlineLinkButton>
        </SettingsParagraph>
    );
};

export default AddMoreScribeSeat;

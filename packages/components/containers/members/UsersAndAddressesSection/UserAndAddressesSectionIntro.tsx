import { useState } from 'react';

import { c, msgid } from 'ttag';

import { useMembers } from '@proton/account/members/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms';
import Prompt from '@proton/components/components/prompt/Prompt';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { getHasExternalMemberCapableB2BPlan, getHasInboxB2BPlan } from '@proton/payments';
import { useIsB2BTrial } from '@proton/payments/ui';
import { MEMBER_SUBSCRIBER } from '@proton/shared/lib/constants';
import { getOrganizationDenomination } from '@proton/shared/lib/organization/helper';

const UserAndAddressesSectionIntro = () => {
    const [user] = useUser();
    const [members] = useMembers();
    const [subscription] = useSubscription();
    const [organization] = useOrganization();

    const isTrial = useIsB2BTrial(subscription, organization);
    const [showTrialPrompt, setShowTrialPrompt] = useState(false);

    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();

    const selfMember = members?.find((member) => member.Self);
    const hasExternalMemberCapableB2BPlan = getHasExternalMemberCapableB2BPlan(subscription);
    const hasInboxB2BPlan = getHasInboxB2BPlan(subscription);
    const hasFamilyOrg = getOrganizationDenomination(organization) === 'familyGroup';

    if (hasFamilyOrg) {
        return c('familyOffer_2023:Info for members section')
            .t`Add, remove, and make changes to user accounts in your family group.`;
    }

    if (hasExternalMemberCapableB2BPlan || hasInboxB2BPlan) {
        const handleGetMoreLicense = () =>
            isTrial
                ? setShowTrialPrompt(true)
                : openSubscriptionModal({
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

        const maxMembers = organization?.MaxMembers || 0;
        const usedMembers = organization?.UsedMembers || 0;
        const maxAI = organization?.MaxAI || 0;
        const usedAI = organization?.UsedAI || 0;

        const MoreLicenseButton = () => {
            if (user.canPay && selfMember?.Subscriber === MEMBER_SUBSCRIBER.PAYER) {
                return (
                    <>
                        <Button
                            shape="outline"
                            color="norm"
                            size="small"
                            disabled={loadingSubscriptionModal}
                            onClick={handleGetMoreLicense}
                        >
                            {c('Action').t`Get more licenses`}
                        </Button>

                        <Prompt
                            open={showTrialPrompt}
                            title={c('Title').t`Cannot add licenses`}
                            buttons={[
                                <Button color="norm" onClick={() => setShowTrialPrompt(false)} type="submit">{c(
                                    'Action'
                                ).t`Got it`}</Button>,
                            ]}
                            onClose={() => setShowTrialPrompt(false)}
                        >
                            {c('Body').ngettext(
                                msgid`Your free trial includes ${maxMembers} license. You can add more licenses once your full subscription starts.`,
                                `Your free trial includes a maximum of ${maxMembers} licenses. You can add more licenses once your full subscription starts.`,
                                maxMembers
                            )}
                        </Prompt>
                    </>
                );
            }

            return null;
        };

        if (maxAI > 0) {
            if (usedAI === 0) {
                return (
                    <>
                        <p className="m-0 lg:max-w-1/2">
                            {c('Info').ngettext(
                                msgid`You are currently using ${usedMembers} of your ${maxMembers} available user license and none of your ${maxAI} available writing assistant license.`,
                                `You are currently using ${usedMembers} of your ${maxMembers} available user license and none of your ${maxAI} available writing assistant licenses.`,
                                maxMembers
                            )}
                        </p>
                        <MoreLicenseButton />
                    </>
                );
            }

            return (
                <>
                    <p className="m-0 lg:max-w-1/2">
                        {c('Info').ngettext(
                            msgid`You are currently using ${usedMembers} of your ${maxMembers} available user license and ${usedAI} of your ${maxAI} available writing assistant license.`,
                            `You are currently using ${usedMembers} of your ${maxMembers} available user licenses and ${usedAI} of your ${maxAI} available writing assistant licenses.`,
                            maxMembers
                        )}
                    </p>
                    <MoreLicenseButton />
                </>
            );
        }

        return (
            <>
                <p className="m-0">
                    {c('Info').ngettext(
                        msgid`You are currently using ${usedMembers} of your ${maxMembers} available user license.`,
                        `You are currently using ${usedMembers} of your ${maxMembers} available user licenses.`,
                        maxMembers
                    )}
                </p>
                <MoreLicenseButton />
            </>
        );
    }

    return c('familyOffer_2023:Info for members section')
        .t`Add, remove, and make changes to user accounts in your organization.`;
};

export default UserAndAddressesSectionIntro;

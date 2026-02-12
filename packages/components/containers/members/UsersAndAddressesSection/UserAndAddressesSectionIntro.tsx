import { c, msgid } from 'ttag';

import { useCustomDomains } from '@proton/account/domains/hooks';
import { useMembers } from '@proton/account/members/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { getHasExternalMemberCapableB2BPlan, getHasInboxB2BPlan, hasBundleBiz2025 } from '@proton/payments';
import { MAIL_APP_NAME, MEMBER_SUBSCRIBER } from '@proton/shared/lib/constants';
import { getOrganizationDenomination } from '@proton/shared/lib/organization/helper';

interface Props {
    onOpenNewDomainModal: (open: boolean) => void;
}
const UserAndAddressesSectionIntro = ({ onOpenNewDomainModal }: Props) => {
    const [user] = useUser();
    const [members] = useMembers();
    const [subscription] = useSubscription();
    const [organization] = useOrganization();
    const [customDomains] = useCustomDomains();

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

        const maxMembers = organization?.MaxMembers || 0;
        const usedMembers = organization?.UsedMembers || 0;
        const maxAI = organization?.MaxAI || 0;
        const usedAI = organization?.UsedAI || 0;

        const MoreLicenseButton = () => {
            if (user.canPay && selfMember?.Subscriber === MEMBER_SUBSCRIBER.PAYER) {
                return (
                    <Button
                        shape="outline"
                        color="norm"
                        size="small"
                        disabled={loadingSubscriptionModal}
                        onClick={handleGetMoreLicense}
                    >
                        {c('Action').t`Get more licenses`}
                    </Button>
                );
            }

            return null;
        };

        if (organization?.RequiresDomain && customDomains?.length === 0) {
            return (
                <>
                    <p className="m-0 lg:max-w-4/5">
                        {c('Message')
                            .t`Connect your custom domain (e.g. yourcompany.com) to create email addresses for other people, manage ${MAIL_APP_NAME} for a business, school, or group.`}
                    </p>
                    <Button shape="outline" color="norm" size="small" onClick={() => onOpenNewDomainModal(true)}>
                        {c('Action').t`Add domain`}
                    </Button>
                </>
            );
        }

        // bundlebiz2025 has AI features included for all members, so we don't need to show the writing assistant usage info
        if (maxAI > 0 && !hasBundleBiz2025(subscription)) {
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

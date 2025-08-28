import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import BYOEClaimProtonAddressModal from '@proton/activation/src/components/Modals/BYOEClaimProtonAddressModal/BYOEClaimProtonAddressModal';
import { Button, InlineLinkButton } from '@proton/atoms';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import BugModal from '@proton/components/containers/support/BugModal';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import { getIsBYOEOnlyAccount } from '@proton/shared/lib/helpers/address';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import type { AcceptInvitationValidation, PendingInvitation } from '@proton/shared/lib/interfaces';
import { getUsedSpace } from '@proton/shared/lib/user/storage';

interface Props {
    invite: PendingInvitation;
    errors: AcceptInvitationValidation;
    onClose: () => void;
}

const PendingInvitationModalErrors = ({ errors, invite, onClose }: Props) => {
    const [user] = useUser();
    const [addresses] = useAddresses();
    const [bugReportModal, setBugReportOpen, render] = useModalState();
    const [claimProtonAddressModalProps, setClaimProtonAddressModalOpen, renderClaimProtonAddressModal] =
        useModalState();

    const inviteSpace = humanSize({ bytes: invite.MaxSpace, withoutUnit: false, fraction: 0 });
    const usedSpace = humanSize({ bytes: getUsedSpace(user), withoutUnit: false, fraction: 0 });

    const isBYOE = getIsBYOEOnlyAccount(addresses);

    let errorDescription: string | string[] = '';

    // translator: full sentence is: You can only accept 3 invitations in a 6-month period. Please contact <customer support> if you require an exception.
    const supportLink = (
        <Button className="p-0 align-baseline" shape="underline" color="norm" onClick={() => setBugReportOpen(true)}>{c(
            'familyOffer_2023:Family plan'
        ).t`customer support`}</Button>
    );

    const addressSettingsLink = (
        <SettingsLink app={APPS.PROTONMAIL} path="/identity-addresses" onClick={onClose} target="_self">
            {c('familyOffer_2023:Family plan').t`Manage addresses`}
        </SettingsLink>
    );

    const byoeClaimProtonAddressButton = (
        <InlineLinkButton onClick={() => setClaimProtonAddressModalOpen(true)}>{c('Action')
            .t`Claim your free ${BRAND_NAME} address`}</InlineLinkButton>
    );

    const link = isBYOE ? byoeClaimProtonAddressButton : addressSettingsLink;

    if (errors.IsLifetimeAccount) {
        errorDescription = c('familyOffer_2023:Family plan').t`Lifetime accounts cannot join a family plan.`;
    } else if (errors.HasOrgWithMembers) {
        errorDescription = c('familyOffer_2023:Family plan')
            .t`Owners of a plan with members cannot join another family plan.`;
    } else if (errors.HasCustomDomains) {
        errorDescription = c('familyOffer_2023:Family plan').t`Accounts with custom domains cannot join a family plan.`;
    } else if (errors.ExceedsMaxSpace) {
        errorDescription = c('familyOffer_2023:Family plan')
            .t`Your account is using ${usedSpace} of storage, which exceeds the ${inviteSpace} you were allocated. Delete some data or ask the plan admin to increase your storage.`;
    } else if (errors.ExceedsAddresses) {
        errorDescription = c('familyOffer_2023:Family plan')
            .jt`Your account has more email addresses than what's available to you in this plan. ${addressSettingsLink}`;
    } else if (errors.ExceedsMaxAcceptedInvitations) {
        // translator: full sentence is: You can only accept 3 invitations in a 6-month period. Please contact <customer support> if you require an exception.
        errorDescription = c('familyOffer_2023:Family plan')
            .jt`You can only accept 3 invitations in a 6-month period. Please contact ${supportLink} if you require an exception.`;
    } else if (errors.IsOnForbiddenPlan) {
        errorDescription = c('familyOffer_2023:Family plan')
            .t`You cannot accept this invitation with your current plan.`;
    } else if (errors.IsExternalUser) {
        errorDescription = c('familyOffer_2023:Family plan')
            .jt`Family plans do not currently support external accounts. Create a ${BRAND_NAME} address before joining. ${link}`;
    } else if (errors.HasUnpaidInvoice) {
        errorDescription = c('familyOffer_2023:Family plan')
            .t`You have unpaid invoices. Please pay them before joining a family plan.`;
    }

    return (
        <>
            {render && <BugModal email={user.Email} username={user.Name} {...bugReportModal} />}
            {renderClaimProtonAddressModal && (
                <BYOEClaimProtonAddressModal toApp={APPS.PROTONMAIL} {...claimProtonAddressModalProps} />
            )}
            <div>
                <p className="color-danger text-bold m-0">{c('familyOffer_2023:Family plan')
                    .t`Sorry, you can't switch plans at this time.`}</p>
                <p className="m-0">{errorDescription}</p>
            </div>
        </>
    );
};

export default PendingInvitationModalErrors;

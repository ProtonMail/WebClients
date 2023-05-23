import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { SettingsLink, useModalState } from '@proton/components/components';
import { BugModal, useUser } from '@proton/components/index';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { AcceptInvitationValidation, PendingInvitation } from '@proton/shared/lib/interfaces';

interface Props {
    invite: PendingInvitation;
    errors: AcceptInvitationValidation;
    onClose: () => void;
}

const PendingInvitationModalErrors = ({ errors, invite, onClose }: Props) => {
    const [user] = useUser();
    const [bugReportModal, setBugReportOpen, render] = useModalState();

    const inviteSpace = humanSize(invite.MaxSpace, undefined, false, 0);
    const usedSpace = humanSize(user.UsedSpace, undefined, false, 0);

    let errorDescription: string | string[] = '';

    // translator: full sentence is: You can only accept 3 invitations in a 6-month period. Please contact <customer support> if you require an exception.
    const supportLink = (
        <Button className="p-0 align-baseline" shape="underline" color="norm" onClick={() => setBugReportOpen(true)}>{c(
            'familyOffer_2023:Family plan'
        ).t`customer support`}</Button>
    );

    const addressSettingsLink = (
        <SettingsLink app={APPS.PROTONMAIL} path="/identity-addresses" onClick={onClose} target="_self">
            {c('familyOffer_2023:Family plan').t`Manage addresses.`}
        </SettingsLink>
    );

    if (errors.IsLifetimeAccount) {
        errorDescription = c('familyOffer_2023:Family plan')
            .t`Visionary and family plans do not currently support lifetime accounts.`;
    } else if (errors.HasOrgWithMembers) {
        errorDescription = c('familyOffer_2023:Family plan')
            .t`Owners of a plan with members cannot join another group plan.`;
    } else if (errors.HasCustomDomains) {
        errorDescription = c('familyOffer_2023:Family plan')
            .t`Accounts with custom domains cannot join a Visionary or family plan.`;
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
            .t`Your current plan cannot join a Visionary or family plan.`;
    } else if (errors.IsExternalUser) {
        errorDescription = c('familyOffer_2023:Family plan')
            .jt`Visionary and family plans do not currently support external accounts. Create a ${BRAND_NAME} address before joining. ${addressSettingsLink}`;
    }

    return (
        <>
            {render && <BugModal email={user.Email} username={user.Name} {...bugReportModal} />}
            <div>
                <p className="color-danger text-bold m-0">{c('familyOffer_2023:Family plan')
                    .t`Sorry, you can't switch plans at this time.`}</p>
                <p className="m0">{errorDescription}</p>
            </div>
        </>
    );
};

export default PendingInvitationModalErrors;

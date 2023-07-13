import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import {
    ModalStateProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useSettingsLink,
} from '@proton/components/components';
import { useApi, useCache, useConfig, useEventManager, useNotifications } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks';
import { acceptInvitation, rejectInvitation } from '@proton/shared/lib/api/user';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { PendingInvitation } from '@proton/shared/lib/interfaces';
import { OrganizationModel } from '@proton/shared/lib/models';

import PendingInvitationModalErrors from './PendingInvitationModalErrors';

interface Props extends ModalStateProps {
    invite: PendingInvitation;
}

const PendingInvitationModal = ({ invite, ...modalProps }: Props) => {
    const api = useApi();
    const cache = useCache();
    const goToSettings = useSettingsLink();
    const protonConfig = useConfig();

    const { createNotification } = useNotifications();

    const { call } = useEventManager();
    const [loadingAccept, withLoadingAccept] = useLoading();
    const [loadingReject, withLoadingReject] = useLoading();

    const hasErrors = !invite.Validation.Valid;

    const handleRejectInvitation = async () => {
        await api(rejectInvitation(invite.ID));
        await call();
        modalProps.onClose();
    };

    const handleAcceptInvitation = async () => {
        await api(acceptInvitation(invite.ID));
        await call();
        modalProps.onClose();
        createNotification({
            text: c('familyOffer_2023:Family plan').t`You have successfully joined the Family plan`,
        });
        if (protonConfig.APP_NAME === APPS.PROTONACCOUNT) {
            cache.delete(OrganizationModel.key); // Force refresh the organization since it's not present in the event manager
            goToSettings('/account-password', APPS.PROTONACCOUNT);
        }
    };

    const inviteEmail = <strong>{`<${invite.InviterEmail}>`}</strong>;
    const assignedStorage = <strong>{humanSize(invite.MaxSpace, undefined, false, 0)}</strong>;

    const BRAND_NAME_TWO = BRAND_NAME;

    return (
        <ModalTwo {...modalProps} size="large">
            <ModalTwoHeader
                // translator: Title of the modal to accept or reject an invitation to join a family plan, no period at the end of the sentence. Looks like: "You are invited to join Bernie's family"
                title={c('familyOffer_2023:Family plan').t`You are invited to join ${invite.OrganizationName}`}
            />
            <ModalTwoContent>
                <div className="bg-weak p-3 rounded flex gap-2 mb-4">
                    <div>{c('familyOffer_2023:Family plan').jt`Invited by: ${inviteEmail}`}</div>
                    <div>{c('familyOffer_2023:Family plan').jt`Storage assigned to you: ${assignedStorage}`}</div>
                </div>
                {hasErrors ? (
                    <PendingInvitationModalErrors
                        errors={invite.Validation}
                        invite={invite}
                        onClose={modalProps.onClose}
                    />
                ) : (
                    <>
                        <p className="my-2">{c('familyOffer_2023:Family plan')
                            .jt`You're invited to link your ${BRAND_NAME} Account to this group plan and together enjoy all ${BRAND_NAME_TWO} premium features.`}</p>
                        <p className="my-2">{c('familyOffer_2023:Family plan')
                            .t`The subscription is billed to the Visionary or family plan's primary admin.`}</p>
                        <p className="my-2">{c('familyOffer_2023:Family plan')
                            .t`If you accept the invitation, we'll switch you from your current plan and credit your account with any remaining balance.`}</p>
                    </>
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button
                    loading={loadingReject}
                    disabled={loadingAccept}
                    onClick={() => withLoadingReject(handleRejectInvitation())}
                >{c('familyOffer_2023:Action').t`Decline invitation`}</Button>
                {hasErrors ? (
                    <Button color="norm" onClick={() => modalProps.onClose()}>{c('familyOffer_2023:Action')
                        .t`Got it`}</Button>
                ) : (
                    <Button
                        disabled={loadingReject}
                        loading={loadingAccept}
                        color="norm"
                        onClick={() => withLoadingAccept(handleAcceptInvitation())}
                    >{c('familyOffer_2023:Action').t`Switch plans`}</Button>
                )}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default PendingInvitationModal;

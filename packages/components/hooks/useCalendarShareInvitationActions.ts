import { useCallback } from 'react';

import { c } from 'ttag';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useGetAddresses } from '@proton/account/addresses/hooks';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import useGetEncryptionPreferences from '@proton/components/hooks/useGetEncryptionPreferences';
import useNotifications from '@proton/components/hooks/useNotifications';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import {
    acceptCalendarShareInvitation,
    rejectCalendarShareInvitation,
} from '@proton/shared/lib/calendar/sharing/shareProton/shareProton';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import type { CalendarMemberInvitation } from '@proton/shared/lib/interfaces/calendar';

const useCalendarShareInvitationActions = () => {
    const getAddresses = useGetAddresses();
    const api = useApi();
    const { call } = useEventManager();
    const getAddressKeys = useGetAddressKeys();
    const getEncryptionPreferences = useGetEncryptionPreferences();
    const { createNotification } = useNotifications();

    const accept = useCallback(
        async ({
            invitation,
            skipSignatureVerification,
            onFinish,
            onError,
        }: {
            invitation: CalendarMemberInvitation;
            skipSignatureVerification?: boolean;
            onFinish?: () => void;
            onError: (e: Error) => void;
        }) => {
            const {
                CalendarID: calendarID,
                Email: invitedEmail,
                Passphrase: armoredPassphrase,
                Calendar: { SenderEmail: senderEmail, Name: calendarName },
                Signature: armoredSignature,
            } = invitation;
            const addresses = await getAddresses();
            const canonicalizedInvitedEmail = canonicalizeInternalEmail(invitedEmail);
            const addressID = addresses.find(
                ({ Email }) => canonicalizeInternalEmail(Email) === canonicalizedInvitedEmail
            )?.ID;

            if (!addressID) {
                const text = 'Own address not found';
                createNotification({ type: 'error', text });
                throw new Error(text);
            }
            try {
                const accepted = await acceptCalendarShareInvitation({
                    addressID,
                    calendarID,
                    armoredPassphrase,
                    armoredSignature,
                    senderEmail,
                    getAddressKeys,
                    getEncryptionPreferences,
                    skipSignatureVerification,
                    api: getSilentApi(api),
                });
                createNotification({
                    type: 'success',
                    text: c('Notification in shared calendar modal').t`Joined ${calendarName} (${senderEmail})`,
                });
                await call();
                onFinish?.();
                return accepted;
            } catch (e: any) {
                if (!(e instanceof Error)) {
                    onError(new Error('Unknown error'));
                }
                onError(e);
            }
        },
        [api, getAddressKeys]
    );

    const reject = useCallback(
        async ({
            invitation,
            onFinish,
            onError,
        }: {
            invitation: CalendarMemberInvitation;
            onFinish?: () => void;
            onError: (e: Error) => void;
        }) => {
            const { CalendarID: calendarID, Email: invitedEmail } = invitation;
            const canonicalizedInvitedEmail = canonicalizeInternalEmail(invitedEmail);
            const addresses = await getAddresses();
            const addressID = addresses.find(
                ({ Email }) => canonicalizeInternalEmail(Email) === canonicalizedInvitedEmail
            )?.ID;

            if (!addressID) {
                const text = 'Own address not found';
                createNotification({ type: 'error', text });
                throw new Error(text);
            }

            if (!addressID) {
                const text = 'Own address not found';
                createNotification({ type: 'error', text });
                throw new Error(text);
            }
            try {
                await rejectCalendarShareInvitation({
                    addressID,
                    calendarID,
                    api: getSilentApi(api),
                });
                createNotification({
                    type: 'success',
                    text: c('Notification in shared calendar modal').t`Calendar invitation declined`,
                });
                await call();
                onFinish?.();
            } catch (e: any) {
                if (!(e instanceof Error)) {
                    onError(new Error('Unknown error'));
                }
                onError(e);
            }
        },
        [api]
    );

    return { accept, reject };
};

export default useCalendarShareInvitationActions;

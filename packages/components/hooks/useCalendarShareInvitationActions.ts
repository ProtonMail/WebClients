import { useCallback } from 'react';

import { c } from 'ttag';

import { useAddresses, useEventManager, useGetAddressKeys, useNotifications } from '@proton/components/hooks/index';
import useApi from '@proton/components/hooks/useApi';
import { acceptCalendarShareInvitation, rejectCalendarShareInvitation } from '@proton/shared/lib/calendar/share';
import { canonizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { CalendarMemberInvitation } from '@proton/shared/lib/interfaces/calendar';
import noop from '@proton/utils/noop';

const useCalendarShareInvitationActions = () => {
    const [addresses] = useAddresses();
    const api = useApi();
    const { call } = useEventManager();
    const getAddressKeys = useGetAddressKeys();
    const { createNotification } = useNotifications();

    const accept = useCallback(
        async (invitation: CalendarMemberInvitation, onFinish?: () => void) => {
            const {
                CalendarID: calendarID,
                Email: invitedEmail,
                Passphrase: armoredPassphrase,
                Calendar: { SenderEmail: senderEmail, Name: calendarName },
            } = invitation;
            const canonizedInvitedEmail = canonizeInternalEmail(invitedEmail);
            const addressID = addresses.find(({ Email }) => canonizeInternalEmail(Email) === canonizedInvitedEmail)?.ID;

            try {
                if (!addressID) {
                    const text = 'Own address not found';
                    createNotification({ type: 'error', text });
                    throw new Error(text);
                }
                await acceptCalendarShareInvitation({
                    addressID,
                    calendarID,
                    armoredPassphrase,
                    getAddressKeys,
                    api,
                });
                createNotification({
                    type: 'success',
                    text: c('Notification in shared calendar modal').t`Joined ${calendarName} (${senderEmail})`,
                });
                void call();
            } catch {
                noop();
            } finally {
                onFinish?.();
            }
        },
        [api, getAddressKeys]
    );

    const reject = useCallback(
        async (invitation: CalendarMemberInvitation, onFinish?: () => void) => {
            const { CalendarID: calendarID, Email: invitedEmail } = invitation;
            const canonizedInvitedEmail = canonizeInternalEmail(invitedEmail);
            const addressID = addresses.find(({ Email }) => canonizeInternalEmail(Email) === canonizedInvitedEmail)?.ID;

            if (!addressID) {
                const text = 'Own address not found';
                createNotification({ type: 'error', text });
                throw new Error(text);
            }

            try {
                if (!addressID) {
                    const text = 'Own address not found';
                    createNotification({ type: 'error', text });
                    throw new Error(text);
                }
                await rejectCalendarShareInvitation({ addressID, calendarID, api });
                createNotification({
                    type: 'success',
                    text: c('Notification in shared calendar modal').t`Calendar invitation declined`,
                });
                void call();
            } catch {
                noop();
            } finally {
                onFinish?.();
            }
        },
        [api]
    );

    return { accept, reject };
};

export default useCalendarShareInvitationActions;

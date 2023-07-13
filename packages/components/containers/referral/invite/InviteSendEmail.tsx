import { useEffect, useMemo, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { AddressesAutocomplete, Icon, useApi, useContactEmails, useNotifications } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { sendEmailInvitation } from '@proton/shared/lib/api/core/referrals';
import { Recipient, Referral } from '@proton/shared/lib/interfaces';

import { useReferralInvitesContext } from '../ReferralInvitesContext';
import InviteSendEmailRecipient from './InviteSendEmailRecipient';
import { deduplicateRecipients, filterContactEmails, isValidEmailAdressToRefer } from './helpers';

interface SendEmailInvitationResult {
    Code: number;
    Referrals: Referral[];
}

const InviteSendEmail = () => {
    const api = useApi();
    const {
        invitedReferralsState: [invitedReferrals, setInvitedReferrals],
        fetchedReferralStatus: { emailsAvailable },
    } = useReferralInvitesContext();
    const anchorRef = useRef<HTMLInputElement>(null);
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [hasInvalidRecipients, setHasInvalidRecipients] = useState<boolean>(false);
    const [contactEmails, contactEmailIsLoading] = useContactEmails();
    const { createNotification } = useNotifications();
    const [apiLoading, withLoading] = useLoading();

    const filteredContactEmails = useMemo(() => {
        if (contactEmailIsLoading) {
            return [];
        }

        return filterContactEmails(contactEmails);
    }, [contactEmails]);

    const handleSendEmails = () => {
        if (!recipients.length) {
            createNotification({ text: c('Warning').t`Please add at least one recipient.`, type: 'warning' });
            return;
        }

        const emails = recipients
            .filter((recipient) => isValidEmailAdressToRefer(recipient.Address))
            .map((recipient) => recipient.Address);

        const emailSendLimitNumber = emailsAvailable - invitedReferrals.length;
        if (emails.length > emailSendLimitNumber) {
            createNotification({
                type: 'warning',
                text: c('Info').ngettext(
                    msgid`You can't send more than ${emailSendLimitNumber} email invite for the next 24 hours`,
                    `You can't send more than ${emailSendLimitNumber} email invites for the next 24 hours`,
                    emailSendLimitNumber
                ),
            });
            return;
        }

        const request = api<SendEmailInvitationResult>(sendEmailInvitation({ emails }));

        void withLoading(request).then((result) => {
            if (result?.Referrals && result?.Referrals.length) {
                createNotification({
                    text: c('Info').ngettext(
                        msgid`Invite successfully sent`,
                        `Invites successfully sent`,
                        result.Referrals.length
                    ),
                });

                setInvitedReferrals(result.Referrals);
            }

            setRecipients([]);
        });
    };

    const onAutocompleteKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Backspace' && event.currentTarget.value.length === 0 && recipients.length > 0) {
            const lastRecipient = recipients[recipients.length - 1];
            const nextRecipients = recipients.filter((recipient) => recipient.Address !== lastRecipient.Address);

            if (lastRecipient) {
                setRecipients(nextRecipients);
            }
        }
    };

    const onAutocompleteAddRecipient = (addedRecipients: Recipient[]) => {
        const dedupRecipients = deduplicateRecipients(addedRecipients, recipients);
        setRecipients(dedupRecipients);
    };

    useEffect(() => {
        if (recipients.some((recipient) => !isValidEmailAdressToRefer(recipient.Address))) {
            setHasInvalidRecipients(true);
            return;
        }

        setHasInvalidRecipients(false);
    }, [recipients]);

    return (
        <div>
            <h2 className="h3 text-bold" id="id_desc_invite_email">{c('Label').t`Invite via email`}</h2>
            <div className="flex gap-2 flex-nowrap flex-align-items-end on-mobile-flex-column rounded">
                <div className="flex-item-fluid-auto">
                    <div
                        className="addresses-wrapper field hauto flex gap-2 px-2"
                        onClick={() => {
                            anchorRef.current?.focus();
                        }}
                    >
                        {recipients.map((recipient) => (
                            <InviteSendEmailRecipient
                                key={recipient.Address}
                                recipient={recipient}
                                isValid={isValidEmailAdressToRefer(recipient.Address)}
                                onDeleteRecipient={(e) => {
                                    e.stopPropagation();
                                    setRecipients(recipients.filter((rec) => rec.Address !== recipient.Address));
                                }}
                            />
                        ))}
                        <div className="flex-item-fluid flex referral-program-invite-input">
                            <AddressesAutocomplete
                                id="recipientsAutocomplete"
                                className="border-none p-1"
                                ref={anchorRef}
                                anchorRef={anchorRef}
                                loading={contactEmailIsLoading}
                                recipients={recipients}
                                contactEmails={filteredContactEmails}
                                hasEmailPasting
                                hasAddOnBlur
                                onAddRecipients={onAutocompleteAddRecipient}
                                onKeyDown={onAutocompleteKeyDown}
                                aria-labelledby="id_desc_invite_email"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex-item-noshrink text-right">
                    <Button
                        title={c('Button').t`Invite`}
                        color="norm"
                        onClick={handleSendEmails}
                        loading={apiLoading || contactEmailIsLoading}
                        disabled={hasInvalidRecipients}
                    >
                        <span className="flex flex-nowrap flex-align-items-center">
                            <Icon name="paper-plane" className="mr-1 flex-item-noshrink" /> {c('Button').t`Send`}
                        </span>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default InviteSendEmail;

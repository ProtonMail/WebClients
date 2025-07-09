import type { KeyboardEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import AddressesAutocomplete from '@proton/components/components/addressesAutocomplete/AddressesAutocomplete';
import Icon from '@proton/components/components/icon/Icon';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useContactEmails } from '@proton/mail/store/contactEmails/hooks';
import { sendEmailInvitation } from '@proton/shared/lib/api/core/referrals';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { PROTONMAIL_DOMAINS, getEmailParts } from '@proton/shared/lib/helpers/email';
import type { Recipient, Referral } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { useReferralInvitesContext } from '../ReferralInvitesContext';
import InviteSendEmailRecipient from './InviteSendEmailRecipient';
import { deduplicateRecipients, filterContactEmails, isValidEmailAdressToRefer } from './helpers';

import './InviteSendEmail.scss';

interface SendEmailInvitationResult {
    Code: number;
    Referrals: Referral[];
}

const InviteSendEmail = ({ className }: { className?: string }) => {
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
    const [protonDomains, setProtonDomains] = useState<Set<string>>(() => new Set(PROTONMAIL_DOMAINS));

    const filteredContactEmails = useMemo(() => {
        if (!contactEmails || contactEmailIsLoading) {
            return [];
        }

        return filterContactEmails(protonDomains, contactEmails);
    }, [protonDomains, contactEmails, contactEmailIsLoading]);

    const handleSendEmails = () => {
        if (!recipients.length) {
            createNotification({ text: c('Warning').t`Please add at least one recipient.`, type: 'warning' });
            return;
        }

        const emails = recipients
            .filter((recipient) => isValidEmailAdressToRefer(protonDomains, recipient.Address))
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

        void withLoading(
            request
                .then((result) => {
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
                })
                .catch((error) => {
                    const { message } = getApiError(error);
                    if (!message) {
                        return;
                    }

                    const domains = emails.reduce<string[]>((acc, email) => {
                        if (message.includes(email)) {
                            const [, domain] = getEmailParts(email);
                            if (domain) {
                                acc.push(domain);
                            }
                        }
                        return acc;
                    }, []);

                    if (domains.length) {
                        setProtonDomains((set) => {
                            return new Set([...set, ...domains]);
                        });
                    }
                })
        );
    };

    const onAutocompleteKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
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
        if (recipients.some((recipient) => !isValidEmailAdressToRefer(protonDomains, recipient.Address))) {
            setHasInvalidRecipients(true);
            return;
        }
        setHasInvalidRecipients(false);
    }, [protonDomains, recipients]);

    return (
        <div className={clsx('flex flex-column gap-4', className)}>
            <h2 className="h3 text-bold" id="id_desc_invite_email">{c('Label').t`Invite via email`}</h2>
            <div className="flex gap-2 flex-column lg:flex-row">
                <div
                    className="flex-auto field flex gap-2 px-2"
                    style={{
                        blockSize: 'unset',
                    }}
                    onClick={() => {
                        anchorRef.current?.focus();
                    }}
                >
                    {recipients.map((recipient) => (
                        <InviteSendEmailRecipient
                            protonDomains={protonDomains}
                            key={recipient.Address}
                            recipient={recipient}
                            isValid={isValidEmailAdressToRefer(protonDomains, recipient.Address)}
                            onDeleteRecipient={(e) => {
                                e.stopPropagation();
                                setRecipients(recipients.filter((rec) => rec.Address !== recipient.Address));
                            }}
                        />
                    ))}
                    <div className="flex-1 flex referral-program-invite-input">
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
                <div className="flex justify-end flex-auto">
                    <Button
                        color="norm"
                        onClick={handleSendEmails}
                        loading={apiLoading}
                        disabled={hasInvalidRecipients || contactEmailIsLoading}
                    >
                        <span className="flex flex-nowrap items-center">
                            <Icon name="paper-plane" className="mr-2 shrink-0" /> {c('Button').t`Send`}
                        </span>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default InviteSendEmail;

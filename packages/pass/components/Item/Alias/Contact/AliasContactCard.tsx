import type { FC } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcPaperPlane } from '@proton/icons/icons/IcPaperPlane';
import clsx from '@proton/utils/clsx';

import { useRequest } from '../../../../hooks/useRequest';
import { aliasBlockContact, aliasDeleteContact } from '../../../../store/actions';
import type { AliasContactWithStatsGetResponse } from '../../../../types';
import { epochToRelativeDuration } from '../../../../utils/time/format';
import { usePassCore } from '../../../Core/PassCoreProvider';
import { FieldBox } from '../../../Form/Field/Layout/FieldBox';
import { FieldsetCluster } from '../../../Form/Field/Layout/FieldsetCluster';
import { DropdownMenuButton } from '../../../Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '../../../Layout/Dropdown/QuickActionsDropdown';
import { useCopyToClipboard } from '../../../Settings/Clipboard/ClipboardProvider';
import { useAliasContacts } from './AliasContactsContext';

type Props = { contact: AliasContactWithStatsGetResponse };

export const AliasContactCard: FC<Props> = ({ contact }) => {
    const { onUpdate, onDelete, shareId, itemId } = useAliasContacts();
    const { onLink } = usePassCore();
    const { createNotification } = useNotifications();
    const copyToClipboard = useCopyToClipboard();

    const {
        CreateTime,
        ReverseAlias,
        Email,
        BlockedEmails: blockedEmailsCount,
        ForwardedEmails: forwardedEmailsCount,
        RepliedEmails: repliedEmailsCount,
        Blocked,
        ID,
    } = contact;
    const time = epochToRelativeDuration(CreateTime);
    const blockContact = useRequest(aliasBlockContact, { onSuccess: onUpdate });
    const deleteContact = useRequest(aliasDeleteContact, { onSuccess: onDelete });

    const handleCopyAddress = async () => {
        await copyToClipboard(ReverseAlias);
        createNotification({
            text: c('Info')
                .t`Forwarding address copied to clipboard. Send an email to this address and ${Email} will receive it.`,
        });
    };

    const mailtoHref = `mailto:${ReverseAlias}`;

    const forwardedEmails = c('Info').ngettext(
        msgid`${forwardedEmailsCount} forwarded`,
        `${forwardedEmailsCount} forwarded`,
        forwardedEmailsCount
    );
    const repliedEmails = c('Info').ngettext(
        msgid`${repliedEmailsCount} sent`,
        `${repliedEmailsCount} sent`,
        repliedEmailsCount
    );
    const blockedEmails = c('Info').ngettext(
        msgid`${blockedEmailsCount} blocked`,
        `${blockedEmailsCount} blocked`,
        blockedEmailsCount
    );

    return (
        <FieldsetCluster className={clsx('mb-3', deleteContact.loading && 'opacity-30 pointer-events-none')}>
            <FieldBox>
                <div className="flex flex-nowrap justify-space-between">
                    <div>
                        <h2 className="text-lg my-2 text-ellipsis">{Email.toLowerCase()}</h2>
                        {!forwardedEmailsCount && !repliedEmailsCount && !blockedEmailsCount && (
                            <div className="text-sm color-weak">{c('Label').t`No Activity in the last 14 days.`}</div>
                        )}
                        <div className="text-sm color-weak">{c('Label').t`Contact created ${time} ago.`}</div>
                        <div className="text-sm color-weak">{
                            // translator: full sentence is: <x> forwarded, <x> sent, <x> blocked, in the last 14 days. (plural included in substrings)
                            c('Label').t`${forwardedEmails}, ${repliedEmails}, ${blockedEmails}, in the last 14 days.`
                        }</div>
                        <Button
                            className="mt-2"
                            pill
                            shape="solid"
                            color="weak"
                            onClick={() =>
                                blockContact.dispatch({
                                    shareId,
                                    itemId,
                                    contactId: ID,
                                    blocked: !Blocked,
                                })
                            }
                            loading={blockContact.loading}
                        >
                            {Blocked ? c('Action').t`Unblock contact` : c('Action').t`Block contact`}
                        </Button>
                    </div>
                    <div className="flex flex-nowrap items-start shrink-0">
                        {!Blocked && (
                            <Button
                                icon
                                pill
                                shape="ghost"
                                className="color-weak"
                                title={c('Action').t`Send email`}
                                onClick={() => onLink(mailtoHref, { replace: true })}
                            >
                                <IcPaperPlane />
                            </Button>
                        )}
                        <QuickActionsDropdown
                            className="color-weak"
                            shape="ghost"
                            iconSize={4}
                            disabled={deleteContact.loading}
                        >
                            <DropdownMenuButton
                                label={c('Action').t`Copy forwarding address`}
                                onClick={handleCopyAddress}
                            />
                            <DropdownMenuButton
                                label={Blocked ? c('Action').t`Unblock contact` : c('Action').t`Block contact`}
                                onClick={() =>
                                    blockContact.dispatch({ shareId, itemId, contactId: ID, blocked: !Blocked })
                                }
                            />
                            <DropdownMenuButton
                                label={c('Action').t`Delete`}
                                danger
                                onClick={() => deleteContact.dispatch({ shareId, itemId, contactId: ID })}
                                loading={deleteContact.loading}
                            />
                        </QuickActionsDropdown>
                    </div>
                </div>
            </FieldBox>
        </FieldsetCluster>
    );
};

import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Icon, useNotifications } from '@proton/components/index';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { FieldBox } from '@proton/pass/components/Form/Field/Layout/FieldBox';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { useAliasContacts } from '@proton/pass/components/Item/Alias/Contact/AliasContactsContext';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { aliasBlockContact, aliasDeleteContact } from '@proton/pass/store/actions';
import type { AliasContactWithStatsGetResponse } from '@proton/pass/types';
import { epochToRelativeDuration } from '@proton/pass/utils/time/format';
import clsx from '@proton/utils/clsx';

type Props = { contact: AliasContactWithStatsGetResponse };

export const AliasContactCard: FC<Props> = ({ contact }) => {
    const { onUpdate, onDelete, shareId, itemId } = useAliasContacts();
    const { writeToClipboard, onLink } = usePassCore();
    const { createNotification } = useNotifications();

    const { CreateTime, ReverseAlias, Email, BlockedEmails, ForwardedEmails, RepliedEmails, Blocked, ID } = contact;
    const time = epochToRelativeDuration(CreateTime);
    const blockContact = useRequest(aliasBlockContact, { onSuccess: onUpdate });
    const deleteContact = useRequest(aliasDeleteContact, { onSuccess: onDelete });

    const handleCopyAddress = async () => {
        await writeToClipboard(ReverseAlias);
        createNotification({
            text: c('Info')
                .t`Reverse alias address copied to clipboard. Send an email to this address and ${Email} will receive it.`,
        });
    };

    const mailtoHref = `mailto:${ReverseAlias}`;

    return (
        <FieldsetCluster className={clsx('mb-3', deleteContact.loading && 'opacity-30 pointer-events-none')}>
            <FieldBox>
                <div className="flex flex-nowrap justify-space-between">
                    <div>
                        <h2 className="text-lg my-2 text-ellipsis">{Email.toLowerCase()}</h2>
                        {!ForwardedEmails && !RepliedEmails && (
                            <div className="text-sm color-weak">{c('Label').t`No Activity in the last 14 days.`}</div>
                        )}
                        <div className="text-sm color-weak">{c('Label').t`Contact created ${time} ago.`}</div>
                        <div className="text-sm color-weak">{c('Label')
                            .t`${ForwardedEmails} forwarded, ${RepliedEmails} sent, ${BlockedEmails} blocked, in the last 14 days.`}</div>
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
                                <Icon name="paper-plane" />
                            </Button>
                        )}
                        <QuickActionsDropdown
                            className="color-weak"
                            shape="ghost"
                            iconSize={4}
                            disabled={deleteContact.loading}
                        >
                            <DropdownMenuButton label={c('Action').t`Copy alias address`} onClick={handleCopyAddress} />
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

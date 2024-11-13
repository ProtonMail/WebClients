import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Icon, Tooltip, useNotifications } from '@proton/components/index';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { FieldBox } from '@proton/pass/components/Form/Field/Layout/FieldBox';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { aliasBlockContact, aliasDeleteContact } from '@proton/pass/store/actions';
import type { AliasContactGetResponse, AliasContactWithStatsGetResponse, UniqueItem } from '@proton/pass/types';
import { epochToRelativeDuration } from '@proton/pass/utils/time/format';

type Props = UniqueItem &
    AliasContactWithStatsGetResponse & {
        onContactDeleted: (ID: number) => void;
        onContactUpdated: (updatedContact: AliasContactGetResponse) => void;
    };

export const ContactCard: FC<Props> = ({
    shareId,
    itemId,
    ID,
    Email,
    Blocked,
    ForwardedEmails,
    RepliedEmails,
    CreateTime,
    ReverseAlias,
    onContactDeleted,
    onContactUpdated,
}) => {
    const { writeToClipboard } = usePassCore();
    const { createNotification } = useNotifications();
    const time = epochToRelativeDuration(CreateTime);

    const blockContactRequest = useRequest(aliasBlockContact, { onSuccess: ({ data }) => onContactUpdated(data) });
    const deleteContactRequest = useRequest(aliasDeleteContact, { onSuccess: ({ data }) => onContactDeleted(data) });

    const handleCopyAddress = async () => {
        await writeToClipboard(ReverseAlias);
        createNotification({
            text: c('Info')
                .t`Reverse alias address copied to clipboard. Send an email to this address and ${Email} will receive it.`,
        });
    };

    return (
        <FieldsetCluster className="mb-3">
            <FieldBox>
                <div className="flex flex-nowrap justify-space-between">
                    <div>
                        <h2 className="text-lg mb-2 text-ellipsis">{Email.toLowerCase()}</h2>
                        {!ForwardedEmails && !RepliedEmails && (
                            <div className="text-sm color-weak">{c('Label').t`No Activity in the last 14 days.`}</div>
                        )}
                        <div className="text-sm color-weak">{c('Label').t`Contact created ${time} ago.`}</div>
                        <div className="text-sm color-weak">{c('Label')
                            .t`${ForwardedEmails} forwarded, ${RepliedEmails} sent in the last 14 days.`}</div>
                        <Button
                            className="mt-2"
                            pill
                            shape="solid"
                            color="weak"
                            onClick={() =>
                                blockContactRequest.dispatch({ shareId, itemId, contactId: ID, blocked: !Blocked })
                            }
                            loading={blockContactRequest.loading}
                        >
                            {Blocked ? c('Action').t`Unblock contact` : c('Action').t`Block contact`}
                        </Button>
                    </div>
                    <div className="flex flex-nowrap items-start shrink-0">
                        <Tooltip openDelay={500} originalPlacement="top" title={c('Action').t`Copy alias address`}>
                            <Button
                                icon
                                pill
                                shape="ghost"
                                className="color-weak"
                                onClick={handleCopyAddress}
                                title={c('Action').t`Copy alias address`}
                            >
                                <Icon name="paper-plane" />
                            </Button>
                        </Tooltip>
                        <QuickActionsDropdown className="color-weak" shape="ghost" iconSize={4}>
                            <DropdownMenuButton label={c('Action').t`Copy alias address`} onClick={handleCopyAddress} />
                            <DropdownMenuButton
                                label={Blocked ? c('Action').t`Unblock contact` : c('Action').t`Block contact`}
                                onClick={() =>
                                    blockContactRequest.dispatch({ shareId, itemId, contactId: ID, blocked: !Blocked })
                                }
                            />
                            <DropdownMenuButton
                                label={c('Action').t`Delete`}
                                danger
                                onClick={() => deleteContactRequest.dispatch({ shareId, itemId, contactId: ID })}
                                loading={deleteContactRequest.loading}
                            />
                        </QuickActionsDropdown>
                    </div>
                </div>
            </FieldBox>
        </FieldsetCluster>
    );
};

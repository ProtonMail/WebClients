import { type MouseEvent, type VFC, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { c, msgid } from 'ttag';

import { InlineLinkButton, useNotifications } from '@proton/components';
import { getAliasDetailsIntent, selectAliasDetails, selectLoginItemByUsername } from '@proton/pass/store';
import { aliasDetailsRequest } from '@proton/pass/store/actions/requests';
import { pipe } from '@proton/pass/utils/fp';
import { getFormattedDateFromTimestamp } from '@proton/pass/utils/time/format';

import { ConfirmationModal } from '../../../../shared/components/confirmation';
import { TextAreaReadonly } from '../../../../shared/components/fields/TextAreaReadonly';
import { useActionWithRequest } from '../../../../shared/hooks/useActionWithRequest';
import { useDeobfuscatedValue } from '../../../../shared/hooks/useDeobfuscatedValue';
import type { ItemTypeViewProps } from '../../../../shared/items/types';
import { DropdownMenuButton } from '../../../components/Dropdown/DropdownMenuButton';
import { MoreInfoDropdown } from '../../../components/Dropdown/MoreInfoDropdown';
import { ValueControl } from '../../../components/Field/Control/ValueControl';
import { FieldsetCluster } from '../../../components/Field/Layout/FieldsetCluster';
import { ItemViewPanel } from '../../../components/Panel/ItemViewPanel';

export const AliasView: VFC<ItemTypeViewProps<'alias'>> = ({ vault, revision, ...itemViewProps }) => {
    const history = useHistory();
    const { createNotification } = useNotifications();

    const { data: item, itemId, createTime, modifyTime, revision: revisionNumber } = revision;
    const { name } = item.metadata;
    const { shareId } = vault;
    const { optimistic, trashed } = itemViewProps;
    const aliasEmail = revision.aliasEmail!;

    const relatedLogin = useSelector(selectLoginItemByUsername(aliasEmail));
    const relatedLoginName = relatedLogin?.data.metadata.name ?? '';
    const note = useDeobfuscatedValue(item.metadata.note);

    const getAliasDetails = useActionWithRequest({
        action: getAliasDetailsIntent,
        requestId: aliasDetailsRequest(aliasEmail),
        onFailure: () => {
            createNotification({
                type: 'warning',
                text: c('Warning').t`Cannot retrieve mailboxes for this alias right now`,
            });
        },
    });

    const mailboxesForAlias = useSelector(selectAliasDetails(aliasEmail!));

    const [confirmTrash, setConfirmTrash] = useState(false);
    const ready = !(getAliasDetails.loading && mailboxesForAlias === undefined);

    const createLoginFromAlias = (evt: MouseEvent) => {
        evt.stopPropagation();
        evt.preventDefault();
        history.push(`/item/new/login?username=${aliasEmail}`);
    };

    useEffect(() => {
        if (!optimistic) getAliasDetails.dispatch({ shareId, itemId, aliasEmail });
    }, [optimistic, shareId, itemId, aliasEmail]);

    const handleMoveToTrashClick = useCallback(() => {
        if (!relatedLogin) return itemViewProps.handleMoveToTrashClick();
        return setConfirmTrash(true);
    }, [relatedLogin, itemViewProps.handleMoveToTrashClick]);

    return (
        <ItemViewPanel
            type="alias"
            name={name}
            vault={vault}
            {...itemViewProps}
            {...(!trashed
                ? {
                      quickActions: [
                          <DropdownMenuButton
                              key="create-login"
                              onClick={createLoginFromAlias}
                              icon="user"
                              label={c('Action').t`Create login`}
                          />,
                      ],
                  }
                : {})}
            handleMoveToTrashClick={handleMoveToTrashClick}
        >
            <FieldsetCluster mode="read" as="div">
                <ValueControl
                    clickToCopy
                    icon="alias"
                    label={c('Label').t`Alias address`}
                    value={aliasEmail ?? undefined}
                    {...(!trashed
                        ? {
                              extra: (
                                  <InlineLinkButton className="text-underline" onClick={createLoginFromAlias}>{c(
                                      'Action'
                                  ).t`Create login`}</InlineLinkButton>
                              ),
                          }
                        : {})}
                />

                <ValueControl as="ul" loading={!ready} icon="arrow-up-and-right-big" label={c('Label').t`Forwards to`}>
                    {mailboxesForAlias?.map(({ email }) => (
                        <li key={email} className="text-ellipsis">
                            {email}
                        </li>
                    ))}
                </ValueControl>
            </FieldsetCluster>

            {note && (
                <FieldsetCluster mode="read" as="div">
                    <ValueControl
                        clickToCopy
                        as={TextAreaReadonly}
                        icon="note"
                        label={c('Label').t`Note`}
                        value={note}
                    />
                </FieldsetCluster>
            )}

            <MoreInfoDropdown
                info={[
                    {
                        label: c('Label').t`Modified`,
                        values: [
                            c('Info').ngettext(
                                msgid`${revisionNumber} time`,
                                `${revisionNumber} times`,
                                revisionNumber
                            ),
                            getFormattedDateFromTimestamp(modifyTime),
                        ],
                    },
                    { label: c('Label').t`Created`, values: [getFormattedDateFromTimestamp(createTime)] },
                ]}
            />
            <ConfirmationModal
                open={confirmTrash}
                title={c('Warning').t`Trash alias ?`}
                alertText={c('Warning')
                    .t`Alias "${name}" is currently used in login item "${relatedLoginName}". You will also stop receiving emails sent to "${aliasEmail}"`}
                submitText={c('Action').t`Move to trash`}
                onClose={() => setConfirmTrash(false)}
                onSubmit={pipe(() => setConfirmTrash(false), itemViewProps.handleMoveToTrashClick)}
            />
        </ItemViewPanel>
    );
};

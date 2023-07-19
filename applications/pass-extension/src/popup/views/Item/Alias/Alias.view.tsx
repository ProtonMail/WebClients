import { type MouseEvent, type VFC, useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { c, msgid } from 'ttag';

import { DropdownMenuButton, Icon, InlineLinkButton, useNotifications } from '@proton/components';
import {
    aliasDetailsRequested,
    selectLoginItemByUsername,
    selectMailboxesForAlias,
    selectRequestInFlight,
    selectRequestStatus,
} from '@proton/pass/store';
import * as requests from '@proton/pass/store/actions/requests';
import { pipe } from '@proton/pass/utils/fp';
import { getFormattedDateFromTimestamp } from '@proton/pass/utils/time/format';

import { ConfirmationModal } from '../../../../shared/components/confirmation';
import { TextAreaReadonly } from '../../../../shared/components/fields/TextAreaReadonly';
import type { ItemTypeViewProps } from '../../../../shared/items/types';
import { MoreInfoDropdown } from '../../../components/Dropdown/MoreInfoDropdown';
import { ValueControl } from '../../../components/Field/Control/ValueControl';
import { FieldsetCluster } from '../../../components/Field/Layout/FieldsetCluster';
import { ItemViewPanel } from '../../../components/Panel/ItemViewPanel';

export const AliasView: VFC<ItemTypeViewProps<'alias'>> = ({ vault, revision, ...itemViewProps }) => {
    const { data: item, itemId, aliasEmail, createTime, modifyTime, revision: revisionNumber } = revision;
    const { name, note } = item.metadata;
    const { optimistic, trashed } = itemViewProps;
    const relatedLogin = useSelector(selectLoginItemByUsername(aliasEmail));
    const relatedLoginName = relatedLogin?.data.metadata.name ?? '';

    const dispatch = useDispatch();
    const history = useHistory();

    const { createNotification } = useNotifications();
    const mailboxesForAlias = useSelector(selectMailboxesForAlias(aliasEmail!));
    const aliasDetailsLoading = useSelector(selectRequestInFlight(requests.aliasDetails(aliasEmail!)));
    const aliasDetailsRequestStatus = useSelector(selectRequestStatus(requests.aliasDetails(aliasEmail!)));

    const [confirmTrash, setConfirmTrash] = useState(false);
    const ready = !aliasDetailsLoading && mailboxesForAlias !== undefined;
    const requestFailure = aliasDetailsRequestStatus === 'failure' && mailboxesForAlias === undefined;

    const createLoginFromAlias = (evt: MouseEvent) => {
        evt.stopPropagation();
        evt.preventDefault();
        history.push(`/item/new/login?username=${aliasEmail}`);
    };

    useEffect(() => {
        if (!optimistic && mailboxesForAlias === undefined) {
            dispatch(aliasDetailsRequested({ shareId: vault.shareId, itemId, aliasEmail: aliasEmail! }));
        }
    }, [optimistic, vault, itemId, mailboxesForAlias]);

    useEffect(() => {
        if (requestFailure) {
            createNotification({
                type: 'warning',
                text: c('Warning').t`Cannot retrieve mailboxes for this alias right now`,
            });
        }
    }, [requestFailure]);

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
                              className="flex flex-align-items-center text-left"
                              onClick={createLoginFromAlias}
                          >
                              <Icon name="user" className="mr-3 color-weak" />
                              {c('Action').t`Create login`}
                          </DropdownMenuButton>,
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

                <ValueControl as="ul" icon="arrow-up-and-right-big" label={c('Label').t`Forwards to`}>
                    {(!ready || requestFailure) && <div className="pass-skeleton pass-skeleton--select" />}
                    {ready &&
                        mailboxesForAlias.map(({ email }) => (
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

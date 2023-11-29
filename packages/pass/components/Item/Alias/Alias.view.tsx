import { type MouseEvent, type VFC, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { c, msgid } from 'ttag';

import { InlineLinkButton, useNotifications } from '@proton/components';
import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { getNewItemRoute } from '@proton/pass/components/Core/routing';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextAreaReadonly } from '@proton/pass/components/Form/legacy/TextAreaReadonly';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { MoreInfoDropdown } from '@proton/pass/components/Layout/Dropdown/MoreInfoDropdown';
import { ItemViewPanel } from '@proton/pass/components/Layout/Panel/ItemViewPanel';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { useDeobfuscatedValue } from '@proton/pass/hooks/useDeobfuscatedValue';
import { useFilters } from '@proton/pass/hooks/useFilters';
import { getAliasDetailsIntent } from '@proton/pass/store/actions';
import { aliasDetailsRequest } from '@proton/pass/store/actions/requests';
import { selectAliasDetails, selectLoginItemByUsername } from '@proton/pass/store/selectors';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { getFormattedDateFromTimestamp } from '@proton/pass/utils/time/format';

export const AliasView: VFC<ItemViewProps<'alias'>> = ({ vault, revision, ...itemViewProps }) => {
    const history = useHistory();
    const { createNotification } = useNotifications();
    const { endpoint } = usePassCore();
    const { setFilters } = useFilters();

    const { data: item, itemId, createTime, modifyTime, revision: revisionNumber } = revision;
    const { name } = item.metadata;
    const { shareId } = vault;
    const { optimistic, trashed } = itemViewProps;
    const aliasEmail = revision.aliasEmail!;

    const relatedLogin = useSelector(selectLoginItemByUsername(aliasEmail));
    const relatedLoginName = relatedLogin?.data.metadata.name ?? '';
    const note = useDeobfuscatedValue(item.metadata.note);

    const getAliasDetails = useActionRequest({
        action: getAliasDetailsIntent,
        initialRequestId: aliasDetailsRequest(aliasEmail),
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
        // FIXME: change this when migrating the extension to the browser router
        if (endpoint === 'web') {
            history.push(`${getNewItemRoute('login')}?username=${aliasEmail}`);
            setFilters({ selectedShareId: shareId });
        } else {
            history.replace(`/item/new/login?username=${aliasEmail}`);
        }
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

import { type VFC, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { c, msgid } from 'ttag';

import { InlineLinkButton, useNotifications } from '@proton/components';
import {
    aliasDetailsRequested,
    selectLoginItemByUsername,
    selectMailboxesForAlias,
    selectRequestInFlight,
    selectRequestStatus,
} from '@proton/pass/store';
import * as requests from '@proton/pass/store/actions/requests';
import { getFormattedDateFromTimestamp } from '@proton/pass/utils/time/format';

import { ItemTypeViewProps } from '../../../../shared/items/types';
import { MoreInfoDropdown } from '../../../components/Dropdown/MoreInfoDropdown';
import { ClickToCopyValueControl } from '../../../components/Field/Control/ClickToCopyValueControl';
import { ValueControl } from '../../../components/Field/Control/ValueControl';
import { FieldsetCluster } from '../../../components/Field/Layout/FieldsetCluster';
import { ItemViewPanel } from '../../../components/Panel/ItemViewPanel';

export const AliasView: VFC<ItemTypeViewProps<'alias'>> = ({ vault, revision, ...itemViewProps }) => {
    const { data: item, itemId, aliasEmail, createTime, modifyTime, revision: revisionNumber } = revision;
    const { name, note } = item.metadata;
    const { optimistic } = itemViewProps;

    const dispatch = useDispatch();
    const history = useHistory();

    const { createNotification } = useNotifications();
    const mailboxesForAlias = useSelector(selectMailboxesForAlias(aliasEmail!));
    const aliasDetailsLoading = useSelector(selectRequestInFlight(requests.aliasDetails(aliasEmail!)));
    const aliasDetailsRequestStatus = useSelector(selectRequestStatus(requests.aliasDetails(aliasEmail!)));
    const relatedLogin = useSelector(selectLoginItemByUsername(aliasEmail ?? ''));

    const ready = !aliasDetailsLoading && mailboxesForAlias !== undefined;
    const requestFailure = aliasDetailsRequestStatus === 'failure' && mailboxesForAlias === undefined;

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

    return (
        <ItemViewPanel type="alias" name={name} vault={vault} {...itemViewProps}>
            <FieldsetCluster mode="read" as="div">
                <ClickToCopyValueControl value={aliasEmail ?? ''}>
                    <ValueControl
                        interactive
                        icon="alias"
                        label={c('Label').t`Alias address`}
                        {...(!relatedLogin
                            ? {
                                  extra: (
                                      <InlineLinkButton
                                          className="text-underline"
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              e.preventDefault();
                                              history.push(`/item/new/login?username=${aliasEmail}`);
                                          }}
                                      >{c('Action').t`Create login`}</InlineLinkButton>
                                  ),
                              }
                            : {})}
                    >
                        {aliasEmail}
                    </ValueControl>
                </ClickToCopyValueControl>

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
                    <ClickToCopyValueControl value={note}>
                        <ValueControl interactive as="pre" icon="note" label={c('Label').t`Note`}>
                            <pre className="text-break">{note}</pre>
                        </ValueControl>
                    </ClickToCopyValueControl>
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
        </ItemViewPanel>
    );
};

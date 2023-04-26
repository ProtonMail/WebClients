import { type VFC, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { useNotifications } from '@proton/components';
import {
    aliasDetailsRequested,
    selectMailboxesForAlias,
    selectRequestInFlight,
    selectRequestStatus,
} from '@proton/pass/store';
import * as requests from '@proton/pass/store/actions/requests';
import { getFormattedDateFromTimestamp } from '@proton/pass/utils/time/format';

import { ItemTypeViewProps } from '../../../../shared/items/types';
import { MoreInfoDropdown } from '../../../components/Dropdown/MoreInfoDropdown';
import { FieldsetCluster } from '../../../components/Fields';
import { ClickToCopyValue } from '../../../components/Fields/controls/ClickToCopyValue';
import { ValueControl } from '../../../components/Fields/controls/ValueControl';
import { ItemViewPanel } from '../../../components/Panel/ItemViewPanel';

export const AliasView: VFC<ItemTypeViewProps<'alias'>> = ({ vault, revision, ...itemViewProps }) => {
    const { data: item, itemId, aliasEmail, createTime, modifyTime, revision: revisionNumber } = revision;
    const { name, note } = item.metadata;
    const { optimistic } = itemViewProps;

    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const mailboxesForAlias = useSelector(selectMailboxesForAlias(aliasEmail!));
    const aliasDetailsLoading = useSelector(selectRequestInFlight(requests.aliasDetails(aliasEmail!)));
    const aliasDetailsRequestStatus = useSelector(selectRequestStatus(requests.aliasDetails(aliasEmail!)));

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
                <ClickToCopyValue value={aliasEmail ?? ''}>
                    <ValueControl interactive icon="alias" label={c('Label').t`Alias address`}>
                        {aliasEmail}
                    </ValueControl>
                </ClickToCopyValue>

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
                    <ValueControl as="pre" icon="note" label={c('Label').t`Note`}>
                        <pre className="text-break">{note}</pre>
                    </ValueControl>
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

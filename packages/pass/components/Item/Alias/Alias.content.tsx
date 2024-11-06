import type { ReactNode } from 'react';
import { type FC, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextAreaReadonly } from '@proton/pass/components/Form/legacy/TextAreaReadonly';
import { AliasContact } from '@proton/pass/components/Item/Alias/Contact/AliasContact';
import type { ItemContentProps } from '@proton/pass/components/Views/types';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { useDeobfuscatedValue } from '@proton/pass/hooks/useDeobfuscatedValue';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { getAliasDetailsIntent, notification } from '@proton/pass/store/actions';
import { aliasDetailsRequest } from '@proton/pass/store/actions/requests';
import { selectAliasDetails, selectAliasMailboxes, selectCanManageAlias } from '@proton/pass/store/selectors';
import { PassFeature } from '@proton/pass/types/api/features';

import { AliasStatusToggle } from './AliasStatusToggle';

export const AliasContent: FC<ItemContentProps<'alias', { optimistic: boolean; actions: ReactNode }>> = ({
    revision,
    history = false,
    optimistic = false,
    actions = [],
}) => {
    const dispatch = useDispatch();
    const canManageAlias = useSelector(selectCanManageAlias);

    const { data: item, shareId, itemId } = revision;

    const aliasEmail = revision.aliasEmail!;
    const note = useDeobfuscatedValue(item.metadata.note);
    const mailboxesForAlias = useSelector(selectAliasMailboxes(aliasEmail!));
    const canToggleStatus = useFeatureFlag(PassFeature.PassSimpleLoginAliasesSync);

    const getAliasDetails = useActionRequest(getAliasDetailsIntent, {
        requestId: aliasDetailsRequest(aliasEmail),
        onFailure: () => {
            dispatch(
                notification({
                    type: 'warning',
                    text: c('Warning').t`Cannot retrieve mailboxes for this alias right now`,
                    offline: false,
                })
            );
        },
    });

    const aliasDetails = useSelector(selectAliasDetails(aliasEmail));
    const displayName = aliasDetails?.name;

    const ready = !(getAliasDetails.loading && mailboxesForAlias === undefined);
    const allowActions = canToggleStatus && !history;
    const aliasActions = allowActions ? <AliasStatusToggle disabled={optimistic} revision={revision} /> : undefined;

    useEffect(() => {
        if (!optimistic) getAliasDetails.dispatch({ shareId, itemId, aliasEmail });
    }, [optimistic, shareId, itemId, aliasEmail]);

    return (
        <>
            <FieldsetCluster mode="read" as="div">
                <ValueControl
                    clickToCopy
                    icon="alias"
                    label={c('Label').t`Alias address`}
                    value={aliasEmail ?? undefined}
                    extra={actions}
                    valueClassName="mr-12"
                    actions={aliasActions}
                    actionsContainerClassName="self-center"
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

            {displayName && (
                <>
                    <FieldsetCluster mode="read" as="div">
                        <ValueControl
                            clickToCopy
                            icon="card-identity"
                            label={c('Label').t`Display name`}
                            value={displayName}
                        />
                    </FieldsetCluster>
                    <div className="color-weak mb-4">{c('Info')
                        .t`The display name when sending an email from this alias.`}</div>
                </>
            )}

            {canManageAlias && (
                <>
                    <FieldsetCluster mode="read" as="div">
                        <AliasContact shareId={shareId} itemId={itemId} />
                    </FieldsetCluster>
                    <div className="color-weak mb-4">{c('Info')
                        .t`Need to email someone but don’t want them to see your email address? Set up a contact alias.`}</div>
                </>
            )}
        </>
    );
};

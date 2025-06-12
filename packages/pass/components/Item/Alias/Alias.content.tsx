import type { ReactNode } from 'react';
import { type FC, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import aliasContactSpotlightImg from '@proton/pass/assets/alias/alias-contact-spotlight.svg';
import { ExtraFieldsControl } from '@proton/pass/components/Form/Field/Control/ExtraFieldsControl';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { FieldBox } from '@proton/pass/components/Form/Field/Layout/FieldBox';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextAreaReadonly } from '@proton/pass/components/Form/legacy/TextAreaReadonly';
import { AliasSLNoteLabel } from '@proton/pass/components/Item/Alias/AliasSLNoteLabel';
import { AliasContacts } from '@proton/pass/components/Item/Alias/Contact/AliasContacts';
import { SpotlightGradient } from '@proton/pass/components/Spotlight/SpotlightGradient';
import { WithSpotlight } from '@proton/pass/components/Spotlight/WithSpotlight';
import type { ItemContentProps } from '@proton/pass/components/Views/types';
import { useDeobfuscatedValue } from '@proton/pass/hooks/useDeobfuscatedValue';
import { useActionRequest } from '@proton/pass/hooks/useRequest';
import { deobfuscateExtraFields } from '@proton/pass/lib/items/item.obfuscation';
import { isDisabledAlias } from '@proton/pass/lib/items/item.predicates';
import { getAliasDetailsIntent, notification } from '@proton/pass/store/actions';
import { aliasDetailsRequest } from '@proton/pass/store/actions/requests';
import { selectAliasDetails, selectMailboxesForAlias } from '@proton/pass/store/selectors';
import { SpotlightMessage } from '@proton/pass/types';

import { AliasStatusToggle } from './AliasStatusToggle';

export const AliasContent: FC<ItemContentProps<'alias', { optimistic: boolean; actions: ReactNode }>> = ({
    revision,
    viewingHistory = false,
    optimistic = false,
    actions = [],
}) => {
    const dispatch = useDispatch();

    const { data: item, shareId, itemId } = revision;
    const extraFields = deobfuscateExtraFields(item.extraFields);

    const aliasEmail = revision.aliasEmail!;
    const note = useDeobfuscatedValue(item.metadata.note);
    const mailboxesForAlias = useSelector(selectMailboxesForAlias(aliasEmail!));

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
    const slNote = aliasDetails?.slNote;
    const forwardCount = aliasDetails?.stats?.forwardedEmails ?? 0;
    const repliedCount = aliasDetails?.stats?.repliedEmails ?? 0;
    const blockedCount = aliasDetails?.stats?.blockedEmails ?? 0;
    const canModify = aliasDetails?.modify;

    const forwardText = c('Label').ngettext(msgid`${forwardCount} forward`, `${forwardCount} forwards`, forwardCount);
    const replyText = c('Label').ngettext(msgid`${repliedCount} reply`, `${repliedCount} replies`, repliedCount);
    const blockedText = c('Label').ngettext(msgid`${blockedCount} block`, `${blockedCount} blocks`, blockedCount);

    const ready = !(getAliasDetails.loading && mailboxesForAlias === undefined);
    const allowActions = !viewingHistory && canModify;
    const aliasActions = allowActions ? <AliasStatusToggle disabled={optimistic} revision={revision} /> : undefined;
    const aliasDisabled = isDisabledAlias(revision);

    useEffect(() => {
        if (!optimistic) getAliasDetails.dispatch({ shareId, itemId, aliasEmail });
    }, [optimistic, shareId, itemId, aliasEmail]);

    return (
        <>
            <FieldsetCluster mode="read" as="div">
                <ValueControl
                    clickToCopy
                    icon="alias"
                    label={aliasDisabled ? c('Label').t`Alias address (disabled)` : c('Label').t`Alias address`}
                    value={aliasEmail ?? undefined}
                    extra={actions}
                    valueClassName="mr-12"
                    actions={aliasActions}
                    actionsContainerClassName="self-center"
                />

                {mailboxesForAlias && mailboxesForAlias.length > 0 && (
                    <ValueControl
                        as="ul"
                        loading={!ready}
                        icon="arrow-up-and-right-big"
                        label={c('Label').t`Forwards to`}
                    >
                        {mailboxesForAlias.map(({ email }) => (
                            <li key={email} className="text-ellipsis">
                                {email}
                            </li>
                        ))}
                    </ValueControl>
                )}
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

            {slNote && (
                <FieldsetCluster mode="read" as="div">
                    <ValueControl
                        clickToCopy
                        as={TextAreaReadonly}
                        icon="note"
                        label={<AliasSLNoteLabel />}
                        value={slNote}
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

            {canModify && !viewingHistory && (
                <>
                    <FieldsetCluster mode="read" as="div">
                        <AliasContacts shareId={shareId} itemId={itemId} />
                    </FieldsetCluster>
                    {
                        <WithSpotlight type={SpotlightMessage.ALIAS_DISCOVERY_CONTACT}>
                            {({ close }) => (
                                <SpotlightGradient
                                    title={c('Title').t`Did you know?`}
                                    message={
                                        <span className="flex mr-8">
                                            {c('Info')
                                                .t`Every time your alias receives an email from someone, a new contact is automatically created.`}
                                        </span>
                                    }
                                    className="mb-2"
                                    onClose={close}
                                    backgroundImage={aliasContactSpotlightImg}
                                />
                            )}
                        </WithSpotlight>
                    }
                    <div className="color-weak mb-4">{c('Info')
                        .t`Need to email someone but don’t want them to see your email address? Set up a contact alias.`}</div>

                    <FieldsetCluster mode="read" as="div">
                        <FieldBox icon="chart-line">
                            <div className="color-weak text-sm">{c('Title').t`Activity`}</div>
                            <div>{`${forwardText} • ${replyText} • ${blockedText}`}</div>
                        </FieldBox>
                    </FieldsetCluster>

                    {Boolean(extraFields.length) && (
                        <ExtraFieldsControl extraFields={extraFields} itemId={itemId} shareId={shareId} />
                    )}
                </>
            )}
        </>
    );
};

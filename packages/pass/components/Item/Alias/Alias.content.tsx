import type { ReactNode } from 'react';
import { type FC, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextAreaReadonly } from '@proton/pass/components/Form/legacy/TextAreaReadonly';
import type { ItemContentProps } from '@proton/pass/components/Views/types';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { useDeobfuscatedValue } from '@proton/pass/hooks/useDeobfuscatedValue';
import { getAliasDetailsIntent, notification } from '@proton/pass/store/actions';
import { aliasDetailsRequest } from '@proton/pass/store/actions/requests';
import { selectAliasDetails } from '@proton/pass/store/selectors';

export const AliasContent: FC<ItemContentProps<'alias', { optimistic: boolean; actions: ReactNode }>> = ({
    revision,
    optimistic = false,
    actions = [],
}) => {
    const dispatch = useDispatch();

    const { data: item, shareId, itemId } = revision;
    const aliasEmail = revision.aliasEmail!;
    const note = useDeobfuscatedValue(item.metadata.note);

    const getAliasDetails = useActionRequest(getAliasDetailsIntent, {
        initialRequestId: aliasDetailsRequest(aliasEmail),
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

    const mailboxesForAlias = useSelector(selectAliasDetails(aliasEmail!));
    const ready = !(getAliasDetails.loading && mailboxesForAlias === undefined);

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
        </>
    );
};

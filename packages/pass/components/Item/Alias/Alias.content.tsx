import type { ReactNode } from 'react';
import { type FC, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Toggle, Tooltip } from '@proton/components/index';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextAreaReadonly } from '@proton/pass/components/Form/legacy/TextAreaReadonly';
import type { ItemContentProps } from '@proton/pass/components/Views/types';
import { useActionRequest, useRequest } from '@proton/pass/hooks/useActionRequest';
import { useDeobfuscatedValue } from '@proton/pass/hooks/useDeobfuscatedValue';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { isAliasDisabled } from '@proton/pass/lib/items/item.predicates';
import { aliasSyncStatusToggle, getAliasDetailsIntent, notification } from '@proton/pass/store/actions';
import { aliasDetailsRequest } from '@proton/pass/store/actions/requests';
import { selectAliasDetails } from '@proton/pass/store/selectors';
import { PassFeature } from '@proton/pass/types/api/features';
import { not } from '@proton/pass/utils/fp/predicates';

export const AliasContent: FC<ItemContentProps<'alias', { optimistic: boolean; actions: ReactNode }>> = ({
    revision,
    optimistic = false,
    actions = [],
}) => {
    const dispatch = useDispatch();

    const { data: item, shareId, itemId } = revision;
    const aliasEmail = revision.aliasEmail!;
    const aliasEnabled = not(isAliasDisabled)(revision);
    const note = useDeobfuscatedValue(item.metadata.note);
    const mailboxesForAlias = useSelector(selectAliasDetails(aliasEmail!));

    const toggleStatus = useRequest(aliasSyncStatusToggle, {});
    const canToggleStatus = useFeatureFlag(PassFeature.PassSimpleLoginAliasesSync);

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

    const ready = !(getAliasDetails.loading && mailboxesForAlias === undefined);

    useEffect(() => {
        if (!optimistic) getAliasDetails.dispatch({ shareId, itemId, aliasEmail });
    }, [optimistic, shareId, itemId, aliasEmail]);

    return (
        <>
            <FieldsetCluster mode="read" as="div">
                {canToggleStatus ? (
                    <div className="relative">
                        <ValueControl
                            clickToCopy
                            icon="alias"
                            label={c('Label').t`Alias address`}
                            value={aliasEmail ?? undefined}
                            extra={actions}
                            valueClassName="mr-12"
                        />
                        <div className="absolute flex items-center h-full right-0 top-0 mr-4">
                            <Tooltip
                                openDelay={100}
                                originalPlacement={'bottom'}
                                title={
                                    aliasEnabled
                                        ? c('Action').t`Disable this alias to stop receiving emails sent to this alias`
                                        : c('Action').t`Enable this alias to receive emails sent to this alias`
                                }
                            >
                                {/* FIXME: adding a div because Tooltip doesn't seem to appear or is
                                 * wrongly positioned if <Toggle> is the direct child element */}
                                <div>
                                    <Toggle
                                        checked={aliasEnabled}
                                        loading={toggleStatus.loading}
                                        onChange={({ target: { checked } }) =>
                                            toggleStatus.dispatch({
                                                shareId,
                                                itemId,
                                                enabled: checked,
                                            })
                                        }
                                    ></Toggle>
                                </div>
                            </Tooltip>
                        </div>
                    </div>
                ) : (
                    <ValueControl
                        clickToCopy
                        icon="alias"
                        label={c('Label').t`Alias address`}
                        value={aliasEmail ?? undefined}
                        extra={actions}
                    />
                )}

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

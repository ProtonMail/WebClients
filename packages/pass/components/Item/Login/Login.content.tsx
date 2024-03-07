import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { ExtraFieldsControl } from '@proton/pass/components/Form/Field/Control/ExtraFieldsControl';
import { OTPValueControl } from '@proton/pass/components/Form/Field/Control/OTPValueControl';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextAreaReadonly } from '@proton/pass/components/Form/legacy/TextAreaReadonly';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import type { ItemContentProps } from '@proton/pass/components/Views/types';
import { UpsellRef } from '@proton/pass/constants';
import { useDeobfuscatedItem } from '@proton/pass/hooks/useDeobfuscatedItem';
import { getCharsGroupedByColor } from '@proton/pass/hooks/usePasswordGenerator';
import { selectAliasByAliasEmail, selectTOTPLimits } from '@proton/pass/store/selectors';

export const LoginContent: FC<ItemContentProps<'login'>> = ({ revision }) => {
    const { data: item, shareId, itemId, revision: revisionNumber } = revision;

    const {
        metadata: { note },
        content: { username, password, urls, totpUri },
        extraFields,
    } = useDeobfuscatedItem(item);

    const relatedAlias = useSelector(selectAliasByAliasEmail(username));
    const totpAllowed = useSelector(selectTOTPLimits).totpAllowed(itemId);

    return (
        <>
            <FieldsetCluster mode="read" as="div">
                <ValueControl
                    clickToCopy
                    icon={relatedAlias ? 'alias' : 'user'}
                    label={relatedAlias ? c('Label').t`Username (alias)` : c('Label').t`Username`}
                    value={username}
                />

                <ValueControl
                    clickToCopy
                    hidden
                    icon="key"
                    label={c('Label').t`Password`}
                    value={password}
                    ellipsis={false}
                    valueClassName="text-monospace text-break-all"
                >
                    {password.length ? getCharsGroupedByColor(password) : undefined}
                </ValueControl>

                {totpUri && totpAllowed && (
                    <OTPValueControl
                        payload={{
                            itemId,
                            shareId,
                            totpUri,
                            type: 'item',
                            revisionNumber,
                        }}
                    />
                )}

                {totpUri && !totpAllowed && (
                    <ValueControl icon="lock" label={c('Label').t`2FA secret key (TOTP)`}>
                        <UpgradeButton inline upsellRef={UpsellRef.LIMIT_2FA} />
                    </ValueControl>
                )}
            </FieldsetCluster>

            {urls.length > 0 && (
                <FieldsetCluster mode="read" as="div">
                    <ValueControl icon="earth" label={c('Label').t`Websites`}>
                        {urls.map((url) => (
                            <Href className="block text-ellipsis" href={url} key={url}>
                                {url}
                            </Href>
                        ))}
                    </ValueControl>
                </FieldsetCluster>
            )}

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

            {Boolean(extraFields.length) && (
                <ExtraFieldsControl
                    extraFields={extraFields}
                    itemId={itemId}
                    revisionNumber={revisionNumber}
                    shareId={shareId}
                />
            )}
        </>
    );
};

import { type FC, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { Icon } from '@proton/components/index';
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
import type { SanitizedPasskey } from '@proton/pass/lib/passkeys/types';
import { selectAliasByAliasEmail, selectTOTPLimits } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';

import { PasskeyContentModal } from '../Passkey/Passkey.modal';

export const LoginContent: FC<ItemContentProps<'login'>> = ({ revision }) => {
    const { data: item, shareId, itemId } = revision;
    const [passkey, setPasskey] = useState<MaybeNull<SanitizedPasskey>>(null);

    const {
        metadata: { note },
        content: { username, password, urls, totpUri, passkeys },
        extraFields,
    } = useDeobfuscatedItem(item);

    const relatedAlias = useSelector(selectAliasByAliasEmail(username));
    const totpAllowed = useSelector(selectTOTPLimits).totpAllowed(itemId);

    return (
        <>
            {(passkeys ?? []).map((passkey) => (
                <FieldsetCluster mode="read" key={passkey.keyId} className="pass-fieldset-cluster--standout">
                    <ValueControl
                        icon={'pass-passkey'}
                        label={`${c('Label').t`Passkey`} • ${passkey.domain}`}
                        value={passkey.userName}
                        onClick={() => setPasskey(passkey)}
                        actions={[<Icon className="mt-3" name="chevron-right" size={3} />]}
                    />
                </FieldsetCluster>
            ))}

            {passkey && <PasskeyContentModal passkey={passkey} onClose={() => setPasskey(null)} open size="small" />}

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

                {totpUri && totpAllowed && <OTPValueControl payload={{ totpUri, type: 'uri' }} />}

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
                <ExtraFieldsControl extraFields={extraFields} itemId={itemId} shareId={shareId} />
            )}
        </>
    );
};

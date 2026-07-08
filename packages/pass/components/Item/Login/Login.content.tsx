import { type FC, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Href } from '@proton/atoms/Href/Href';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { ExtraFieldsControl } from '@proton/pass/components/Form/Field/Control/ExtraFieldsControl';
import { OTPValueControl } from '@proton/pass/components/Form/Field/Control/OTPValueControl';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextAreaReadonly } from '@proton/pass/components/Form/legacy/TextAreaReadonly';
import { PasskeyContentModal } from '@proton/pass/components/Item/Passkey/Passkey.modal';
import { PasswordStrength } from '@proton/pass/components/Password/PasswordStrength';
import { UpgradeButton } from '@proton/pass/components/Upsell/UpgradeButton';
import type { ItemContentProps } from '@proton/pass/components/Views/types';
import { UpsellRef } from '@proton/pass/constants';
import { usePasswordStrength } from '@proton/pass/hooks/monitor/usePasswordStrength';
import { useDeobfuscatedItem } from '@proton/pass/hooks/useDeobfuscatedItem';
import { getCharsGroupedByColor } from '@proton/pass/hooks/usePasswordGenerator';
import { useLoginClipboardTelemetry } from '@proton/pass/hooks/useTelemetryEvent';
import type { SanitizedPasskey } from '@proton/pass/lib/passkeys/types';
import { getModeDescription, isAutofillModeDataOfTypeUrl } from '@proton/pass/lib/urls/utils/autofill';
import { isValidScheme } from '@proton/pass/lib/urls/utils/utils';
import { selectAliasByAliasEmail, selectTOTPLimits } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import { TelemetryFieldType } from '@proton/pass/types/data/telemetry';
import { AutofillMode } from '@proton/pass/types/protobuf';

export const LoginContent: FC<ItemContentProps<'login'>> = ({ revision, secureLinkItem = false }) => {
    const { data: item, shareId, itemId } = revision;
    const [passkey, setPasskey] = useState<MaybeNull<SanitizedPasskey>>(null);

    const {
        metadata: { note },
        content: { itemEmail, itemUsername, password, autofillUrls, totpUri, passkeys },
        extraFields,
    } = useDeobfuscatedItem(item);

    /** Filter URLs with unsupported protocols for additional security,
     * especially in the context of shared secure links. CSPs prevents XSS
     * attacks, this acts as a backup safeguard in case client-side validation
     * was bypassed. Only URLs with approved protocols are rendered as links. */
    const sanitizedUrls = useMemo(() => autofillUrls.filter((url) => isValidScheme(url.url)), [autofillUrls]);
    const totpAllowed = useSelector(selectTOTPLimits).totpAllowed(itemId) || secureLinkItem;
    const relatedAlias = useSelector(selectAliasByAliasEmail(itemEmail));
    const passwordStrength = usePasswordStrength(password);
    const showEmptyEmailOrUsername = !(itemEmail || itemUsername);
    /** Checked against the full `autofillUrls`, not `sanitizedUrls`: `Pattern`/`RegularExpression`
     * entries are dropped by the scheme filter but are still valid autofill targets, so a `Never`
     * rule isn't a no-op when one of those is also present. */
    const showOnlyNeverWarning =
        autofillUrls.length > 0 && autofillUrls.every(({ mode }) => mode === AutofillMode.Never);
    const neverModeDescriptionStrong = (
        <strong key="neverModeDescriptionStrong">{getModeDescription(AutofillMode.Never)}</strong>
    );

    const sendClipboardTelemetry = useLoginClipboardTelemetry(item);

    return (
        <>
            {!secureLinkItem &&
                (passkeys ?? []).map((passkey) => (
                    <FieldsetCluster mode="read" key={passkey.keyId}>
                        <ValueControl
                            icon={'pass-passkey'}
                            label={`${c('Label').t`Passkey`} • ${passkey.domain}`}
                            value={passkey.userName}
                            onClick={() => setPasskey(passkey)}
                            actions={[<IcChevronRight className="mt-3" size={3} />]}
                            className="pass-value-control--standout"
                        />
                    </FieldsetCluster>
                ))}

            {passkey && <PasskeyContentModal passkey={passkey} onClose={() => setPasskey(null)} open size="small" />}

            <FieldsetCluster mode="read" as="div">
                {showEmptyEmailOrUsername && (
                    <ValueControl clickToCopy icon="user" label={c('Label').t`Email or username`} />
                )}

                {itemEmail && (
                    <ValueControl
                        clickToCopy
                        icon={relatedAlias ? 'alias' : 'envelope'}
                        label={relatedAlias ? c('Label').t`Email (alias)` : c('Label').t`Email`}
                        value={itemEmail}
                        onCopy={() => sendClipboardTelemetry?.(TelemetryFieldType.email)}
                    />
                )}

                {itemUsername && (
                    <ValueControl
                        clickToCopy
                        icon="user"
                        label={c('Label').t`Username`}
                        value={itemUsername}
                        onCopy={() => sendClipboardTelemetry?.(TelemetryFieldType.username)}
                    />
                )}

                <ValueControl
                    clickToCopy
                    hidden
                    icon="key"
                    label={c('Label').t`Password`}
                    value={password}
                    ellipsis={false}
                    valueClassName="text-monospace text-break-all"
                    actions={
                        passwordStrength
                            ? [<PasswordStrength className="mr-4" strength={passwordStrength} inline />]
                            : undefined
                    }
                    actionsContainerClassName="flex flex-row-reverse"
                    onCopy={() => sendClipboardTelemetry?.(TelemetryFieldType.password)}
                >
                    {password.length ? getCharsGroupedByColor(password) : undefined}
                </ValueControl>

                {totpUri && totpAllowed && (
                    <OTPValueControl
                        icon="lock"
                        payload={{ totpUri, type: 'uri' }}
                        onCopy={() => sendClipboardTelemetry?.(TelemetryFieldType.totp)}
                    />
                )}

                {totpUri && !totpAllowed && (
                    <ValueControl icon="lock" label={c('Label').t`2FA secret key (TOTP)`}>
                        <UpgradeButton inline upsellRef={UpsellRef.LIMIT_2FA} />
                    </ValueControl>
                )}
            </FieldsetCluster>

            {sanitizedUrls.length > 0 && (
                <FieldsetCluster mode="read" as="div">
                    <ValueControl
                        as="ul"
                        ellipsis={false}
                        valueClassName="flex flex-column gap-1 pt-2"
                        icon="earth"
                        label={c('Label').t`Websites`}
                    >
                        {showOnlyNeverWarning && (
                            <Banner variant="warning">
                                {
                                    // translator: neverModeDescriptionStrong is the "Never fill with this exact URL" mode label, in bold
                                    c('Warning')
                                        .jt`This item can't be suggested for autofill due to the "${neverModeDescriptionStrong}". Add another URL if you want this item to autofill.`
                                }
                            </Banner>
                        )}
                        {sanitizedUrls.map((url, index) => (
                            <li
                                key={index}
                                className="w-full flex flex-column border border-weak bg-weak rounded-lg px-2 py-1 gap-1"
                            >
                                <p className="w-full text-ellipsis">
                                    {isAutofillModeDataOfTypeUrl(url.mode) ? (
                                        <Href
                                            className="block text-ellipsis"
                                            href={url.url}
                                            key={url.url}
                                            title={url.url}
                                        >
                                            {url.url}
                                        </Href>
                                    ) : (
                                        <span title={url.url}>{url.url}</span>
                                    )}
                                </p>
                                {url.mode === AutofillMode.Default ? null : (
                                    <p className="color-weak text-ellipsis">{getModeDescription(url.mode)}</p>
                                )}
                            </li>
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
                        onCopy={() => sendClipboardTelemetry?.(TelemetryFieldType.note)}
                    />
                </FieldsetCluster>
            )}

            {Boolean(extraFields.length) && (
                <ExtraFieldsControl
                    extraFields={extraFields}
                    itemId={itemId}
                    shareId={shareId}
                    onCopy={() => sendClipboardTelemetry?.(TelemetryFieldType.customField)}
                />
            )}
        </>
    );
};

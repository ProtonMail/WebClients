import { type VFC } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { Href } from '@proton/atoms';
import { ExtraFieldsControl } from '@proton/pass/components/Form/Field/Control/ExtraFieldsControl';
import { OTPValueControl } from '@proton/pass/components/Form/Field/Control/OTPValueControl';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextAreaReadonly } from '@proton/pass/components/Form/legacy/TextAreaReadonly';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { MoreInfoDropdown } from '@proton/pass/components/Layout/Dropdown/MoreInfoDropdown';
import { ItemViewPanel } from '@proton/pass/components/Layout/Panel/ItemViewPanel';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { useDeobfuscatedItem } from '@proton/pass/hooks/useDeobfuscatedItem';
import { getCharsGroupedByColor } from '@proton/pass/hooks/usePasswordGenerator';
import { selectAliasByAliasEmail, selectTOTPLimits } from '@proton/pass/store/selectors';
import { getFormattedDateFromTimestamp } from '@proton/pass/utils/time/format';

export const LoginView: VFC<ItemViewProps<'login'>> = ({ vault, revision, ...itemViewProps }) => {
    const { data: item, createTime, lastUseTime, modifyTime, revision: revisionNumber, shareId, itemId } = revision;
    const {
        metadata: { name, note },
        content: { username, password, urls, totpUri },
        extraFields,
    } = useDeobfuscatedItem(item);

    const relatedAlias = useSelector(selectAliasByAliasEmail(username));
    const totpAllowed = useSelector(selectTOTPLimits).totpAllowed(itemId);

    return (
        <ItemViewPanel type="login" name={name} vault={vault} {...itemViewProps}>
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
                    <OTPValueControl shareId={shareId} itemId={itemId} totpUri={totpUri} type="item" />
                )}

                {totpUri && !totpAllowed && (
                    <ValueControl icon="lock" label={c('Label').t`2FA secret (TOTP)`}>
                        <UpgradeButton inline />
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

            <MoreInfoDropdown
                info={[
                    {
                        label: c('Label').t`Last autofill`,
                        // translator: when this login was last used
                        values: [lastUseTime ? getFormattedDateFromTimestamp(lastUseTime) : c('Info').t`Never`],
                    },
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

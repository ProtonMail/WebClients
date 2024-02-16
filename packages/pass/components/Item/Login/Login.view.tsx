import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { Href } from '@proton/atoms';
import { ExtraFieldsControl } from '@proton/pass/components/Form/Field/Control/ExtraFieldsControl';
import { OTPValueControl } from '@proton/pass/components/Form/Field/Control/OTPValueControl';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextAreaReadonly } from '@proton/pass/components/Form/legacy/TextAreaReadonly';
import { ItemViewHistoryStats } from '@proton/pass/components/Item/History/ItemViewHistoryStats';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { MoreInfoDropdown } from '@proton/pass/components/Layout/Dropdown/MoreInfoDropdown';
import { ItemViewPanel } from '@proton/pass/components/Layout/Panel/ItemViewPanel';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { UpsellRef } from '@proton/pass/constants';
import { useDeobfuscatedItem } from '@proton/pass/hooks/useDeobfuscatedItem';
import { getCharsGroupedByColor } from '@proton/pass/hooks/usePasswordGenerator';
import { selectAliasByAliasEmail, selectTOTPLimits } from '@proton/pass/store/selectors';

// TODO: refactor this component to support displaying previous item revision (bonus: with diff highlighting)
export const LoginView: FC<ItemViewProps<'login'>> = (itemViewProps) => {
    const { revision, handleHistoryClick } = itemViewProps;
    const { data: item, createTime, lastUseTime, modifyTime, revision: revisionNumber, shareId, itemId } = revision;

    const {
        metadata: { note },
        content: { username, password, urls, totpUri },
        extraFields,
    } = useDeobfuscatedItem(item);

    const relatedAlias = useSelector(selectAliasByAliasEmail(username));
    const totpAllowed = useSelector(selectTOTPLimits).totpAllowed(itemId);

    return (
        <ItemViewPanel type="login" {...itemViewProps}>
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
                <ExtraFieldsControl extraFields={extraFields} itemId={itemId} shareId={shareId} />
            )}

            <ItemViewHistoryStats
                lastUseTime={lastUseTime}
                createTime={createTime}
                modifyTime={modifyTime}
                handleHistoryClick={handleHistoryClick}
            />

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
                        ],
                    },
                    {
                        label: c('Label').t`Item ID`,
                        // translator: label for item identification number
                        values: [itemId],
                    },
                    {
                        label: c('Label').t`Vault ID`,
                        // translator: label for vault identification number
                        values: [shareId],
                    },
                ]}
            />
        </ItemViewPanel>
    );
};

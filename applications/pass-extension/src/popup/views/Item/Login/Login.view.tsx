import { type VFC } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { Href } from '@proton/atoms';
import { selectAliasByAliasEmail, selectTOTPLimits } from '@proton/pass/store';
import { getFormattedDateFromTimestamp } from '@proton/pass/utils/time/format';

import { TextAreaReadonly } from '../../../../shared/components/fields/TextAreaReadonly';
import { UpgradeButton } from '../../../../shared/components/upgrade/UpgradeButton';
import { getCharsGroupedByColor } from '../../../../shared/hooks/usePasswordGenerator';
import type { ItemTypeViewProps } from '../../../../shared/items/types';
import { MoreInfoDropdown } from '../../../components/Dropdown/MoreInfoDropdown';
import { ExtraFieldsControl } from '../../../components/Field/Control/ExtraFieldsControl';
import { OTPValueControl } from '../../../components/Field/Control/OTPValueControl';
import { ValueControl } from '../../../components/Field/Control/ValueControl';
import { FieldsetCluster } from '../../../components/Field/Layout/FieldsetCluster';
import { ItemViewPanel } from '../../../components/Panel/ItemViewPanel';

export const LoginView: VFC<ItemTypeViewProps<'login'>> = ({ vault, revision, ...itemViewProps }) => {
    const { data: item, createTime, lastUseTime, modifyTime, revision: revisionNumber, shareId, itemId } = revision;
    const { metadata, content, extraFields } = item;
    const { name, note } = metadata;
    const { username, password, totpUri, urls } = content;
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
                    valueClassName="flex"
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
                        values: [lastUseTime ? getFormattedDateFromTimestamp(lastUseTime) : c('Info').t`N/A`],
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

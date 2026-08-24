import type { PropsWithChildren } from 'react';
import { type FC, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { UpsellRef } from '../../../../constants';
import { selectExtraFieldLimits } from '../../../../store/selectors';
import type { DeobfuscatedItemExtraField } from '../../../../types';
import { isEmptyString } from '../../../../utils/string/is-empty-string';
import { formatISOYYYYMMDD, formatYYYYMMDD } from '../../../../utils/time/format';
import { TextAreaReadonly } from '../../legacy/TextAreaReadonly';
import { getExtraFieldOption } from '../ExtraFieldGroup/ExtraField.utils';
import { FieldsetCluster } from '../Layout/FieldsetCluster';
import { OTPValueControl } from './OTPValueControl';
import { UpgradeControl } from './UpgradeControl';
import { ValueControl } from './ValueControl';

type ExtraFieldsControlProps = {
    extraFields: DeobfuscatedItemExtraField[];
    itemId: string;
    shareId: string;
    hideIcons?: boolean;
    onCopy?: () => void;
};

export const ExtraFieldsControl: FC<PropsWithChildren<ExtraFieldsControlProps>> = ({
    children,
    extraFields,
    hideIcons = false,
    itemId,
    shareId,
    onCopy,
}) => {
    const { needsUpgrade } = useSelector(selectExtraFieldLimits);

    const getControlByType = useCallback(
        ({ fieldName, type, data }: DeobfuscatedItemExtraField, index: number) => {
            const icon = hideIcons ? undefined : getExtraFieldOption(type).icon;
            const key = `${index}-${fieldName}`;

            if (needsUpgrade) {
                return (
                    <UpgradeControl icon={icon} key={key} label={fieldName} upsellRef={UpsellRef.LIMIT_EXTRA_FIELD} />
                );
            }

            switch (type) {
                case 'totp':
                    return isEmptyString(data.totpUri) ? (
                        <ValueControl icon={icon} key={key} label={fieldName} />
                    ) : (
                        <OTPValueControl
                            icon={icon}
                            key={key}
                            label={fieldName}
                            payload={{ totpUri: data.totpUri, type: 'uri' }}
                            onCopy={onCopy}
                        />
                    );
                case 'timestamp':
                    return isEmptyString(data.timestamp) ? (
                        <ValueControl icon={icon} key={key} label={fieldName} />
                    ) : (
                        <ValueControl
                            clickToCopy
                            key={key}
                            icon={icon}
                            label={fieldName}
                            value={formatYYYYMMDD(data.timestamp)}
                            clipboardValue={formatISOYYYYMMDD(data.timestamp)}
                            onCopy={onCopy}
                        />
                    );
                case 'hidden':
                case 'text':
                    return isEmptyString(data.content) ? (
                        <ValueControl icon={icon} key={key} label={fieldName} />
                    ) : (
                        <ValueControl
                            clickToCopy
                            as={TextAreaReadonly}
                            key={key}
                            hidden={type === 'hidden'}
                            icon={icon}
                            label={fieldName}
                            value={data.content}
                            onCopy={onCopy}
                        />
                    );
            }
        },
        [itemId, shareId]
    );

    return (
        <FieldsetCluster mode="read" as="div">
            {children}
            {extraFields.map((extraField, index) => getControlByType(extraField, index))}
        </FieldsetCluster>
    );
};

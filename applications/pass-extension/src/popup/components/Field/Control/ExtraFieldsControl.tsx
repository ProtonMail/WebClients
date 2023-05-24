import { type VFC, useCallback } from 'react';

import { c } from 'ttag';

import type { ItemExtraField } from '@proton/pass/types';
import { isEmptyString } from '@proton/pass/utils/string';

import { getExtraFieldOptions } from '../ExtraFieldGroup/ExtraField';
import { FieldsetCluster } from '../Layout/FieldsetCluster';
import { ClickToCopyValueControl } from './ClickToCopyValueControl';
import { OTPValueControl } from './OTPValueControl';
import { PasswordValueControl } from './PasswordValueControl';
import { ValueControl } from './ValueControl';

type ExtraFieldsControlProps = {
    extraFields: ItemExtraField[];
    itemId: string;
    shareId: string;
};

export const ExtraFieldsControl: VFC<ExtraFieldsControlProps> = ({ extraFields, itemId, shareId }) => {
    const getControlByType = useCallback(
        ({ fieldName, type, value }: ItemExtraField, index: number) => {
            const { icon } = getExtraFieldOptions()[type];
            const key = `${index}-${fieldName}`;

            switch (type) {
                case 'totp':
                    return (
                        <OTPValueControl
                            key={key}
                            itemId={itemId}
                            label={fieldName}
                            shareId={shareId}
                            totpUri={value}
                            type="extraField"
                            index={index}
                        />
                    );
                case 'hidden':
                    return <PasswordValueControl key={key} icon={icon} label={fieldName} password={value} />;
                case 'text':
                    return (
                        <ClickToCopyValueControl key={key} value={value}>
                            <ValueControl interactive icon={icon} label={fieldName}>
                                {!isEmptyString(value) ? (
                                    value
                                ) : (
                                    <span className="color-weak text-italic">{c('Info').t`None`}</span>
                                )}
                            </ValueControl>
                        </ClickToCopyValueControl>
                    );
            }
        },
        [itemId, shareId]
    );

    return (
        <FieldsetCluster mode="read" as="div">
            {extraFields.map((extraField, index) => getControlByType(extraField, index))}
        </FieldsetCluster>
    );
};

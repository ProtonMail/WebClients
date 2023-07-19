import { type VFC, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectExtraFieldLimits } from '@proton/pass/store';
import type { ItemExtraField } from '@proton/pass/types';
import { isEmptyString } from '@proton/pass/utils/string';

import { TextAreaReadonly } from '../../../../shared/components/fields/TextAreaReadonly';
import { getExtraFieldOption } from '../ExtraFieldGroup/ExtraField';
import { FieldsetCluster } from '../Layout/FieldsetCluster';
import { OTPValueControl } from './OTPValueControl';
import { UpgradeControl } from './UpgradeControl';
import { ValueControl } from './ValueControl';

type ExtraFieldsControlProps = {
    extraFields: ItemExtraField[];
    itemId: string;
    shareId: string;
};

export const ExtraFieldsControl: VFC<ExtraFieldsControlProps> = ({ extraFields, itemId, shareId }) => {
    const { needsUpgrade } = useSelector(selectExtraFieldLimits);

    const getControlByType = useCallback(
        ({ fieldName, type, data }: ItemExtraField, index: number) => {
            const { icon } = getExtraFieldOption(type);
            const key = `${index}-${fieldName}`;

            if (needsUpgrade) {
                return <UpgradeControl icon={icon} key={key} label={fieldName} />;
            }

            switch (type) {
                case 'totp':
                    return isEmptyString(data.totpUri) ? (
                        <ValueControl icon={icon} key={key} label={fieldName} value={undefined} />
                    ) : (
                        <OTPValueControl
                            key={key}
                            itemId={itemId}
                            label={fieldName}
                            shareId={shareId}
                            totpUri={data.totpUri}
                            type="extraField"
                            index={index}
                        />
                    );
                case 'hidden':
                case 'text':
                    return (
                        <ValueControl
                            clickToCopy
                            as={TextAreaReadonly}
                            key={key}
                            hidden={type === 'hidden'}
                            icon={icon}
                            label={fieldName}
                            value={data.content}
                        />
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

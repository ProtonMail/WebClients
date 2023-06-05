import { type VFC, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { selectExtraFieldLimits } from '@proton/pass/store';
import type { ItemExtraField } from '@proton/pass/types';
import { isEmptyString } from '@proton/pass/utils/string';

import { UpgradeButton } from '../../../../shared/components/upgrade/UpgradeButton';
import { getExtraFieldOption } from '../ExtraFieldGroup/ExtraField';
import { FieldsetCluster } from '../Layout/FieldsetCluster';
import { ClickToCopyValueControl } from './ClickToCopyValueControl';
import { MaskedValueControl } from './MaskedValueControl';
import { OTPValueControl } from './OTPValueControl';
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
                return (
                    <ValueControl icon={icon} key={key} label={fieldName}>
                        <UpgradeButton inline />
                    </ValueControl>
                );
            }

            switch (type) {
                case 'totp':
                    return isEmptyString(data.totpUri) ? (
                        <ValueControl icon={icon} key={key} label={fieldName}>
                            <span className="color-weak text-italic">{c('Info').t`None`}</span>
                        </ValueControl>
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
                    return <MaskedValueControl as="pre" key={key} icon={icon} label={fieldName} value={data.content} />;
                case 'text':
                    return (
                        <ClickToCopyValueControl key={key} value={data.content}>
                            <ValueControl interactive as="pre" icon={icon} label={fieldName}>
                                {!isEmptyString(data.content) ? (
                                    data.content
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

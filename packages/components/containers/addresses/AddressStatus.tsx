import React from 'react';
import { c } from 'ttag';
import { Badge } from '../../index';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

interface Props {
    isDefault: boolean;
    isActive: boolean;
    isDisabled: boolean;
    isOrphan: boolean;
    isMissingKeys: boolean;
}

const AddressStatus = ({ isDefault, isActive, isDisabled, isOrphan, isMissingKeys }: Props) => {
    const list = [
        isDefault && {
            text: c('Address status').t`Default`,
            type: 'default'
        },
        isActive && {
            text: c('Address status').t`Active`,
            type: 'success'
        },
        isDisabled && {
            text: c('Address status').t`Disabled`,
            type: 'warning'
        },
        isOrphan && {
            text: c('Address status').t`Orphan`,
            type: 'origin'
        },
        isMissingKeys && {
            text: c('Address status').t`Missing keys`,
            type: 'warning'
        }
    ]
        .filter(isTruthy)
        .map(({ text, type }) => {
            return (
                <Badge key={text} type={type}>
                    {text}
                </Badge>
            );
        });

    return <>{list}</>;
};
export default AddressStatus;

import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Badge } from 'react-components';

const AddressStatus = ({ isDefault, isActive, isDisabled, isOrphan, isMissingKeys }) => {
    return [
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
        .filter(Boolean)
        .map(({ text, type }) => {
            return (
                <Badge key={text} type={type}>
                    {text}
                </Badge>
            );
        });
};

AddressStatus.propTypes = {
    isDefault: PropTypes.bool,
    isActive: PropTypes.bool,
    isDisabled: PropTypes.bool,
    isOrphan: PropTypes.bool,
    isMissingKeys: PropTypes.bool
};

export default AddressStatus;

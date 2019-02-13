import React from 'react';
import PropTypes from 'prop-types';
import { t } from 'ttag';

import Input from '../input/Input';
import Label from '../label/Label';

const Toggle = ({ id }) => {
    return (
        <>
            <Input type="checkbox" id={id} className="pm-toggle-checkbox" />
            <Label htmlFor={id} className="pm-toggle-label">
                <span className="pm-toggle-label-text">{t`On`}</span>
                <span className="pm-toggle-label-text">{t`Off`}</span>
            </Label>
        </>
    );
};

Toggle.propTypes = {
    id: PropTypes.string.isRequired
};

Toggle.defaultProps = {
    id: 'toggle'
};

export default Toggle;
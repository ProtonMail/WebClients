import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import { textToClipboard } from 'proton-shared/lib/helpers/browser';
import Button from './Button';
import Icon from '../icon/Icon';
import { getClasses } from '../../helpers/component';

const Copy = ({ className, value }) => {
    const [copied, setCopied] = useState(false);

    const handleClick = () => {
        textToClipboard(value);

        if (!copied) {
            setCopied(true);
        }
    };

    return (
        <Button
            onClick={handleClick}
            className={getClasses(copied ? 'copied' : '', className)}
            title={copied ? c('Label').t`Copied` : c('Label').t`Copy`}
        >
            <Icon name="clipboard" />
        </Button>
    );
};

Copy.propTypes = {
    value: PropTypes.string.isRequired,
    className: PropTypes.string
};

export default Copy;

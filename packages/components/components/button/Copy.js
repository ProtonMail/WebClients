import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { t } from 'ttag';

import { textToClipboard } from '../../helpers/browser';
import Button from './Button';
import Icon from '../icon/Icon';
import { getClasses } from '../../helpers/component';

const Copy = ({ className }) => {
    const [copied, setCopied] = useState(false);

    const handleClick = () => {
        textToClipboard(this.props.value);

        if (!this.state.copied) {
            setCopied(true);
        }
    };

    return (
        <Button
            onClick={handleClick}
            className={getClasses(copied ? 'copied' : '', className)}
            title={copied ? t`Copied` : t`Copy`}>
            <Icon />
        </Button>
    );
};

Copy.propTypes = {
    value: PropTypes.string.isRequired,
    className: PropTypes.string
};

export default Copy;
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Icon, Button, classnames, Tooltip } from 'react-components';
import { textToClipboard } from 'proton-shared/lib/helpers/browser';

const Copy = ({ value, className = '', onCopy }) => {
    const [copied, setCopied] = useState(false);

    const handleClick = () => {
        textToClipboard(value);
        onCopy && onCopy();

        if (!copied) {
            setCopied(true);
        }
    };

    return (
        <Button onClick={handleClick} className={classnames([className, copied && 'copied'])}>
            <Tooltip title={copied ? c('Label').t`Copied` : c('Label').t`Copy`}>
                <Icon name="clipboard" />
            </Tooltip>
        </Button>
    );
};

Copy.propTypes = {
    value: PropTypes.string.isRequired,
    className: PropTypes.string,
    onCopy: PropTypes.func
};

export default Copy;

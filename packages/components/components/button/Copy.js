import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import { textToClipboard } from 'proton-shared/lib/helpers/browser';
import { Button } from '../button';
import { classnames } from '../../helpers/component';

const Copy = ({ value, className = '' }) => {
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
            icon="clipboard"
            className={classnames([className, copied && 'copied'])}
            title={copied ? c('Label').t`Copied` : c('Label').t`Copy`}
        />
    );
};

Copy.propTypes = {
    value: PropTypes.string.isRequired,
    className: PropTypes.string
};

export default Copy;

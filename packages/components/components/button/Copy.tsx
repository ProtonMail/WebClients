import React, { MouseEvent } from 'react';
import { c } from 'ttag';
import { Icon, Button, Tooltip } from '../../index';
import { textToClipboard } from 'proton-shared/lib/helpers/browser';

interface Props {
    value: string;
    className?: string;
    onCopy?: () => void;
}

const Copy = ({ value, className = '', onCopy }: Props) => {
    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        textToClipboard(value);
        onCopy && onCopy();
    };

    return (
        <Button onClick={handleClick} className={className}>
            <Tooltip className="flex" title={c('Label').t`Copy`}>
                <Icon name="clipboard" />
                <span className="sr-only">{c('Label').t`Copy`}</span>
            </Tooltip>
        </Button>
    );
};

export default Copy;

import React, { useState, useEffect, useRef } from 'react';
import { c } from 'ttag';
import { Icon, Button, classnames, Tooltip } from '../../index';
import { textToClipboard } from 'proton-shared/lib/helpers/browser';

interface Props {
    value: string;
    className?: string;
    onCopy?: () => void;
}

const Copy = ({ value, className = '', onCopy }: Props) => {
    const [copied, setCopied] = useState(false);
    const timeoutRef = useRef<number>();

    const handleClick = () => {
        textToClipboard(value);
        onCopy && onCopy();

        if (!copied) {
            setCopied(true);
            timeoutRef.current = window.setTimeout(() => {
                setCopied(false);
            }, 2000);
        }
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <Button onClick={handleClick} className={classnames([className, copied && 'copied'])}>
            <Tooltip className="flex" title={copied ? c('Label').t`Copied` : c('Label').t`Copy`}>
                <Icon name="clipboard" />
                <span className="sr-only">{copied ? c('Label').t`Copied` : c('Label').t`Copy`}</span>
            </Tooltip>
        </Button>
    );
};

export default Copy;

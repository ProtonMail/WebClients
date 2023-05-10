import { MouseEvent, Ref, forwardRef } from 'react';

import { c } from 'ttag';

import { Button, ButtonProps } from '@proton/atoms';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';

import { Icon } from '../icon';
import { Tooltip } from '../tooltip';

interface Props extends ButtonProps {
    value: string;
    className?: string;
    onCopy?: () => void;
    tooltipText?: string;
}

const Copy = ({ children, value, onCopy, tooltipText, ...rest }: Props, ref: Ref<HTMLButtonElement>) => {
    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        textToClipboard(value, e.currentTarget);
        onCopy?.();
    };

    return (
        <Tooltip title={tooltipText || c('Label').t`Copy`}>
            <Button icon color="weak" shape="outline" ref={ref} {...rest} onClick={handleClick}>
                {children || <Icon name="squares" alt={c('Label').t`Copy`} />}
            </Button>
        </Tooltip>
    );
};

export default forwardRef<HTMLButtonElement, Props>(Copy);

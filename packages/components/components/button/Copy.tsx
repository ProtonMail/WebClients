import { MouseEvent, Ref, forwardRef } from 'react';

import { c } from 'ttag';

import { Button, ButtonLikeShape, ButtonProps } from '@proton/atoms';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';

import { Icon } from '../icon';
import { Tooltip } from '../tooltip';

interface Props extends ButtonProps {
    value: string;
    className?: string;
    onCopy?: () => void;
    tooltipText?: string;
    shape?: ButtonLikeShape;
}

const Copy = (
    { children, value, onCopy, tooltipText, shape = 'outline', ...rest }: Props,
    ref: Ref<HTMLButtonElement>
) => {
    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        textToClipboard(value, e.currentTarget);
        onCopy?.();
    };

    return (
        <Tooltip title={tooltipText || c('Label').t`Copy`}>
            <Button icon color="weak" shape={shape} ref={ref} {...rest} onClick={handleClick}>
                {children || <Icon name="squares" alt={c('Label').t`Copy`} />}
            </Button>
        </Tooltip>
    );
};

export default forwardRef<HTMLButtonElement, Props>(Copy);

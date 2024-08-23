import type { MouseEvent, Ref } from 'react';
import { forwardRef } from 'react';

import { c } from 'ttag';

import type { ButtonLikeShape, ButtonProps } from '@proton/atoms';
import { Button } from '@proton/atoms';
import { copyDomToClipboard, textToClipboard } from '@proton/shared/lib/helpers/browser';

import { Icon } from '../icon';
import { Tooltip } from '../tooltip';

interface Props extends Omit<ButtonProps, 'value'> {
    /**
     * Content that will be copied to the clipboard.
     * If passing a string, text will be copied,
     * but if an HTMLElement is passed, HTML content will be copied, not text (images, links etc.. are kept)
     */
    value: string | HTMLElement;
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

        // In some cases we want to copy the content as HTML
        if (typeof value === 'string') {
            textToClipboard(value, e.currentTarget);
        } else {
            void copyDomToClipboard(value);
        }
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

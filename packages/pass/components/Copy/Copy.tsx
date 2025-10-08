import type { FC, MouseEvent } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ButtonProps } from '@proton/atoms/Button/Button';
import type { ButtonLikeShape } from '@proton/atoms/Button/ButtonLike';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Icon from '@proton/components/components/icon/Icon';
import { useCopyToClipboard } from '@proton/pass/components/Settings/Clipboard/ClipboardProvider';

type Props = ButtonProps & {
    value: string;
    className?: string;
    onCopy?: () => void;
    tooltipText?: string;
    shape?: ButtonLikeShape;
};

export const Copy: FC<Props> = ({ children, value, onCopy, tooltipText, shape = 'outline', ...rest }) => {
    const copyToClipboard = useCopyToClipboard();

    const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        await copyToClipboard(value);
        onCopy?.();
    };

    return (
        <Tooltip title={tooltipText || c('Label').t`Copy`}>
            <Button icon color="weak" shape={shape} {...rest} onClick={handleClick}>
                {children || <Icon name="squares" alt={c('Label').t`Copy`} />}
            </Button>
        </Tooltip>
    );
};

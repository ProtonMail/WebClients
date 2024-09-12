import type { FC, MouseEvent } from 'react';

import { c } from 'ttag';

import { Button, type ButtonLikeShape, type ButtonProps } from '@proton/atoms';
import { Icon, Tooltip } from '@proton/components';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';

type Props = ButtonProps & {
    value: string;
    className?: string;
    onCopy?: () => void;
    tooltipText?: string;
    shape?: ButtonLikeShape;
};

export const Copy: FC<Props> = ({ children, value, onCopy, tooltipText, shape = 'outline', ...rest }) => {
    const { writeToClipboard } = usePassCore();

    const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        await writeToClipboard(value);
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

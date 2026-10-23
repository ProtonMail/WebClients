import type { ReactElement } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import type { ButtonLikeShape, ButtonLikeSize } from '@proton/atoms/Button/ButtonLike';
import type { ThemeColorUnion } from '@proton/colors/types';

export function ButtonWithTextAndIcon({
    shape,
    color,
    size,
    icon,
    buttonText,
    onClick,
    disabled,
    dataTestId,
}: {
    shape?: ButtonLikeShape;
    color?: ThemeColorUnion;
    size?: ButtonLikeSize;
    icon?: ReactElement;
    buttonText: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    disabled?: boolean;
    dataTestId?: string;
}) {
    return (
        <Button
            shape={shape}
            color={color}
            size={size}
            className="inline-flex items-center gap-2"
            onClick={onClick}
            disabled={disabled}
            data-testid={dataTestId}
        >
            {icon}
            {buttonText}
        </Button>
    );
}

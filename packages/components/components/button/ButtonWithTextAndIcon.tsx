import type { ReactElement } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import type { ButtonLikeShape, ButtonLikeSize } from '@proton/atoms/Button/ButtonLike';
import type { ThemeColorUnion } from '@proton/colors/types';

import type { MimeName } from '../icon/MimeIcon';
import MimeIcon from '../icon/MimeIcon';

export function ButtonWithTextAndIcon({
    shape,
    color,
    size,
    icon,
    mimeIconName,
    buttonText,
    onClick,
    disabled,
    dataTestId,
}: {
    shape?: ButtonLikeShape;
    color?: ThemeColorUnion;
    size?: ButtonLikeSize;
    icon?: ReactElement;
    mimeIconName?: MimeName;
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
            {mimeIconName && <MimeIcon name={mimeIconName} />}
            {buttonText}
        </Button>
    );
}

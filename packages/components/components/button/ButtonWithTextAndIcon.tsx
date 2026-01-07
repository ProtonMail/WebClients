import { Button } from '@proton/atoms/Button/Button';
import type { ButtonLikeShape, ButtonLikeSize } from '@proton/atoms/Button/ButtonLike';
import type { ThemeColorUnion } from '@proton/colors/types';
import type { IconName } from '@proton/icons/types';

import Icon from '../icon/Icon';
import type { MimeName } from '../icon/MimeIcon';
import MimeIcon from '../icon/MimeIcon';

export function ButtonWithTextAndIcon({
    shape,
    color,
    size,
    iconName,
    mimeIconName,
    buttonText,
    onClick,
    disabled,
}: {
    shape?: ButtonLikeShape;
    color?: ThemeColorUnion;
    size?: ButtonLikeSize;
    iconName?: IconName;
    mimeIconName?: MimeName;
    buttonText: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    disabled?: boolean;
}) {
    return (
        <Button
            shape={shape}
            color={color}
            size={size}
            className="inline-flex items-center gap-2"
            onClick={onClick}
            disabled={disabled}
        >
            {iconName && <Icon name={iconName} />}
            {mimeIconName && <MimeIcon name={mimeIconName} />}
            {buttonText}
        </Button>
    );
}

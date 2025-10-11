import type { IconName } from 'packages/icons/types';

import { Button } from '@proton/atoms/Button/Button';
import type { ButtonLikeSize } from '@proton/atoms/Button/ButtonLike';
import type { ThemeColorUnion } from '@proton/colors/types';

import Icon from '../icon/Icon';

export function ButtonWithTextAndIcon({
    color,
    size,
    iconName,
    buttonText,
    onClick,
}: {
    color: ThemeColorUnion;
    size: ButtonLikeSize;
    iconName: IconName;
    buttonText: string;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
}) {
    return (
        <Button color={color} size={size} className="inline-flex items-center gap-2" onClick={onClick}>
            <Icon name={iconName} />
            {buttonText}
        </Button>
    );
}

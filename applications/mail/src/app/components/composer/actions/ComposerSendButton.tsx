import type { ReactNode, Ref } from 'react';
import { forwardRef } from 'react';

import type { Color, Shape } from '@proton/components/components/button/ButtonGroup';
import ButtonGroup from '@proton/components/components/button/ButtonGroup';

interface Props {
    color: Color;
    shape: Shape;
    primaryAction: ReactNode;
    secondaryAction?: ReactNode;
}

const ComposerSendButton = ({ primaryAction, secondaryAction, color, shape }: Props, ref: Ref<HTMLDivElement>) => {
    return (
        <ButtonGroup ref={ref} color={color} shape={shape} data-testid="composer:send-actions">
            {primaryAction}
            {secondaryAction}
        </ButtonGroup>
    );
};

export default forwardRef(ComposerSendButton);

import { useCallback } from 'react';

import { c } from 'ttag';

import type { ButtonProps } from '@proton/atoms';
import { Button, Tooltip } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import { copyDomToClipboard } from '@proton/shared/lib/helpers/browser';

interface Props extends Omit<ButtonProps, 'value'> {
    containerRef: React.MutableRefObject<HTMLDivElement | null>;
    onCopy?: () => void;
}

const LumoCopyButton = ({ children, onCopy, containerRef, ...rest }: Props) => {
    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();

            const element = containerRef.current;
            if (!element) return;

            const clonedElement = element.cloneNode(true) as HTMLDivElement;

            clonedElement.querySelectorAll('.lumo-no-copy').forEach((btn) => btn.remove());

            void copyDomToClipboard(clonedElement);
            onCopy?.();
        },
        [containerRef, onCopy]
    );

    return (
        <Tooltip title={c('Label').t`Copy`}>
            <Button icon color="weak" shape={'ghost'} size={'small'} {...rest} onClick={handleClick}>
                <Icon name="squares" alt={c('Label').t`Copy`} />
            </Button>
        </Tooltip>
    );
};

export default LumoCopyButton;

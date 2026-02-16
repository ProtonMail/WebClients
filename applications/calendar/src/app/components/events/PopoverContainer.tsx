import type { Ref } from 'react';
import { forwardRef, useRef } from 'react';
import * as React from 'react';

import useFocusTrap from '@proton/components/components/focus/useFocusTrap';
import { useHotkeys } from '@proton/components/hooks/useHotkeys';
import { useCombinedRefs } from '@proton/hooks';
import clsx from '@proton/utils/clsx';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    isOpen?: boolean;
    onClose?: () => void;
}

const PopoverContainer = (
    { children, className, isOpen = true, onClose, ...rest }: Props,
    ref: Ref<HTMLDivElement>
) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const combinedRefs = useCombinedRefs<HTMLDivElement>(ref, rootRef);
    const focusTrapProps = useFocusTrap({ active: isOpen, rootRef });

    useHotkeys(rootRef, [
        [
            'Escape',
            () => {
                onClose?.();
            },
        ],
    ]);

    return (
        <div ref={combinedRefs} className={clsx([className, 'outline-none'])} {...rest} {...focusTrapProps}>
            {children}
        </div>
    );
};

const ForwardPopoverContainer = forwardRef(PopoverContainer);

export default ForwardPopoverContainer;

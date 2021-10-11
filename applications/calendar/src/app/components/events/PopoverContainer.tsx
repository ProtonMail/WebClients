import { useRef, Ref, forwardRef } from 'react';
import * as React from 'react';
import { useCombinedRefs, useFocusTrap, classnames, useHotkeys } from '@proton/components';

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
        <div ref={combinedRefs} className={classnames([className, 'no-outline'])} {...rest} {...focusTrapProps}>
            {children}
        </div>
    );
};

const ForwardPopoverContainer = forwardRef(PopoverContainer);

export default ForwardPopoverContainer;

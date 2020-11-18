import React, { useRef, Ref, forwardRef } from 'react';
import { useCombinedRefs, useFocusTrap } from 'react-components';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    isOpen?: boolean;
}

const PopoverContainer = ({ children, isOpen = true, ...rest }: Props, ref: Ref<HTMLDivElement>) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const combinedRefs = useCombinedRefs<HTMLDivElement>(ref, rootRef);
    const focusTrapProps = useFocusTrap({ active: isOpen, rootRef });

    return (
        <div ref={combinedRefs} {...rest} {...focusTrapProps}>
            {children}
        </div>
    );
};

const ForwardPopoverContainer = forwardRef(PopoverContainer);

export default ForwardPopoverContainer;

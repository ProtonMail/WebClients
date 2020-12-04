import React, { useRef, Ref, forwardRef } from 'react';
import { useCombinedRefs, useFocusTrap, classnames } from 'react-components';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    isOpen?: boolean;
}

const PopoverContainer = ({ children, className, isOpen = true, ...rest }: Props, ref: Ref<HTMLDivElement>) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const combinedRefs = useCombinedRefs<HTMLDivElement>(ref, rootRef);
    const focusTrapProps = useFocusTrap({ active: isOpen, rootRef });

    return (
        <div ref={combinedRefs} className={classnames([className, 'no-outline'])} {...rest} {...focusTrapProps}>
            {children}
        </div>
    );
};

const ForwardPopoverContainer = forwardRef(PopoverContainer);

export default ForwardPopoverContainer;

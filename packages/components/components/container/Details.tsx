import { ComponentPropsWithRef, forwardRef, Ref, useRef } from 'react';

type Props = ComponentPropsWithRef<'details'>;

const Details = ({ children, className, onToggle, open, ...props }: Props, ref: Ref<HTMLDetailsElement>) => {
    const initialToggle = useRef(true);

    return (
        <details
            className={className}
            ref={ref}
            open={open}
            onToggle={(e) => {
                // onToggle is invoked even with the first mount if the details
                // are opened by default. We don't want that.
                if (initialToggle.current) {
                    initialToggle.current = false;
                    if (open) {
                        return;
                    }
                }
                onToggle?.(e);
            }}
            {...props}
        >
            {children}
        </details>
    );
};

export default forwardRef<HTMLDetailsElement, Props>(Details);

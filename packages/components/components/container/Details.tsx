import React from 'react';

type Props = React.ComponentPropsWithRef<'details'>;

const Details = ({ children, className, onToggle, open, ...props }: Props, ref: React.Ref<HTMLDetailsElement>) => {
    const initialToggle = React.useRef(true);

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

export default React.forwardRef<HTMLDetailsElement, Props>(Details);

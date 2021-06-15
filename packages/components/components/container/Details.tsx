import React from 'react';

interface Props extends React.HTMLProps<HTMLDetailsElement> {
    children: React.ReactNode;
    className?: string;
    defaultOpen?: boolean;
    onToggle?: (event: React.SyntheticEvent) => void;
}

const Details = (
    { children, className, defaultOpen = false, onToggle, ...props }: Props,
    ref: React.Ref<HTMLDetailsElement>
) => {
    const initialToggle = React.useRef(true);
    return (
        <details
            className={className}
            ref={ref}
            // Changing open doesn't open or close the component.
            // Open is used only to set initial state.
            open={defaultOpen}
            onToggle={(e) => {
                // onToggle is invoked even with the first mount if the details
                // are opened by default. We don't want that.
                if (initialToggle.current) {
                    initialToggle.current = false;
                    if (defaultOpen) {
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

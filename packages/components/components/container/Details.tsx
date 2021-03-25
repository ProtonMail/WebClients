import React from 'react';

interface Props extends React.HTMLProps<HTMLDetailsElement> {
    children: React.ReactNode;
    className?: string;
    open?: boolean;
}

const Details = ({ children, className, open = false, ...props }: Props, ref: React.Ref<HTMLDetailsElement>) => (
    <details className={className} open={open} ref={ref} {...props}>
        {children}
    </details>
);

export default React.forwardRef<HTMLDetailsElement, Props>(Details);

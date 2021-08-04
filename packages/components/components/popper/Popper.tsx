import { CSSProperties } from 'react';
import * as React from 'react';
import Portal from '../portal/Portal';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    divRef: React.Ref<HTMLDivElement>;
    role?: string;
    isOpen?: boolean;
    children: React.ReactNode;
    style?: CSSProperties;
}

const Popper = ({ children, isOpen = false, divRef, role = 'tooltip', ...rest }: Props) => {
    if (!isOpen) {
        return null;
    }

    return (
        <Portal>
            <div {...rest} ref={divRef} role={role} hidden={!isOpen} aria-hidden={!isOpen}>
                {children}
            </div>
        </Portal>
    );
};

export default Popper;

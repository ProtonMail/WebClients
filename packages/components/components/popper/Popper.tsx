import { CSSProperties, HTMLAttributes, ReactNode, Ref } from 'react';
import Portal from '../portal/Portal';

interface Props extends HTMLAttributes<HTMLDivElement> {
    divRef: Ref<HTMLDivElement>;
    role?: string;
    isOpen?: boolean;
    children: ReactNode;
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

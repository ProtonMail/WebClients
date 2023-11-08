import { type FC, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import type { ModalProps } from '@proton/components';
import { ModalTwo } from '@proton/components';

import './SidebarModal.scss';

type Props = Omit<ModalProps, 'children'> & { children: ReactNode | ((didEnter: boolean) => ReactNode) };

export const SidebarModal: FC<Props> = ({ children, className, ...props }) => {
    const [didEnter, setDidEnter] = useState(false);
    const timer = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (!props.open) setDidEnter(false);
    }, [props.open]);

    useEffect(() => () => clearTimeout(timer.current), []);

    const onEnter = useCallback(() => {
        props.onEnter?.();
        timer.current = setTimeout(() => setDidEnter(true), 250);
    }, [props.onEnter]);

    return (
        <ModalTwo
            rootClassName="pass-modal-two--sidebar"
            className={className}
            onBackdropClick={props.onClose}
            {...props}
            onEnter={onEnter}
        >
            <div className="h-full">{typeof children === 'function' ? children(didEnter) : children}</div>
        </ModalTwo>
    );
};

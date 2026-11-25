import { type ReactNode, createContext, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';

import Modal from '@proton/components/components/modalTwo/Modal';

interface EasySwitchStepModalHostValue {
    /** Called by the rendered step on every render, so the host always closes with the latest step's handler */
    register: (options: { onClose?: () => void; closeDisabled?: boolean }) => void;
}

const EasySwitchStepModalHostContext = createContext<EasySwitchStepModalHostValue | undefined>(undefined);

export const useEasySwitchStepModalHost = () => useContext(EasySwitchStepModalHostContext);

/**
 * Keeps one dialog open across the steps of a flow: an `EasySwitchStepModal` rendered inside the
 * host draws its layout in the host's dialog instead of opening its own, so moving to the next
 * step swaps the content without closing and reopening the modal (and replaying its animation).
 *
 * The dialog closes with the `onClose` and `closeDisabled` of the step on screen, so the host's
 * children must render exactly one `EasySwitchStepModal` at a time. With none, the close button
 * is gone and Escape does nothing.
 */
export const EasySwitchStepModalHost = ({
    children,
    'data-testid': dataTestId,
}: {
    children: ReactNode;
    'data-testid'?: string;
}) => {
    const onCloseRef = useRef<(() => void) | undefined>(undefined);
    const [closeDisabled, setCloseDisabled] = useState(false);

    const value = useMemo<EasySwitchStepModalHostValue>(
        () => ({
            register: (options) => {
                onCloseRef.current = options.onClose;
                setCloseDisabled(!!options.closeDisabled);
            },
        }),
        []
    );

    return (
        <EasySwitchStepModalHostContext.Provider value={value}>
            <Modal
                open
                size="xlarge"
                className="relative"
                onClose={closeDisabled ? undefined : () => onCloseRef.current?.()}
                data-testid={dataTestId}
            >
                {children}
            </Modal>
        </EasySwitchStepModalHostContext.Provider>
    );
};

/** Hands the step's close options to the host, if there is one */
export const useRegisterInEasySwitchStepModalHost = (onClose?: () => void, closeDisabled?: boolean) => {
    const host = useEasySwitchStepModalHost();
    useLayoutEffect(() => {
        host?.register({ onClose, closeDisabled });
    });
    // Clear on unmount, so the next step never inherits this one's handler
    useLayoutEffect(() => () => host?.register({}), [host]);
};

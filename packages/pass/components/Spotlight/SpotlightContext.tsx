import type { FC } from 'react';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { PendingShareAccessModal } from '@proton/pass/components/Spotlight/PendingShareAccessModal';
import { type MaybeNull } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import type { SpotlightMessageDefinition } from './SpotlightContent';
import type { UpsellingModalType } from './UpsellingModal';
import { UpsellingModal } from './UpsellingModal';

import './Spotlight.scss';

type SpotlightState = {
    open: boolean;
    upselling: MaybeNull<UpsellingModalType>;
    pendingShareAccess: boolean;
    message: MaybeNull<SpotlightMessageDefinition>;
};

export type SpotlightContextValue = {
    setPendingShareAccess: (value: boolean) => void;
    setUpselling: (value: MaybeNull<UpsellingModalType>) => void;
    setMessage: (message: MaybeNull<SpotlightMessageDefinition>) => void;
    state: SpotlightState;
};

const INITIAL_STATE: SpotlightState = { open: false, message: null, upselling: null, pendingShareAccess: false };

export const SpotlightContext = createContext<SpotlightContextValue>({
    setUpselling: noop,
    setPendingShareAccess: noop,
    setMessage: noop,
    state: INITIAL_STATE,
});

export const SpotlightContextProvider: FC = ({ children }) => {
    const timer = useRef<NodeJS.Timeout>();
    const [state, setState] = useState<SpotlightState>(INITIAL_STATE);

    const ctx = useMemo<SpotlightContextValue>(
        () => ({
            setPendingShareAccess: (pendingShareAccess) => setState((prev) => ({ ...prev, pendingShareAccess })),
            setUpselling: (upselling) => setState((prev) => ({ ...prev, upselling })),
            setMessage: (next) => {
                const prev = state.message;

                if (prev?.id !== next?.id) {
                    setState((curr) => ({ ...curr, open: false }));
                    timer.current = setTimeout(
                        () =>
                            setState((prev) => ({
                                ...prev,
                                message: next,
                                open: next !== null,
                            })),
                        500
                    );
                }
            },
            state,
        }),
        [state]
    );

    useEffect(() => () => clearTimeout(timer.current), []);

    return (
        <SpotlightContext.Provider value={ctx}>
            {children}

            <UpsellingModal
                open={state.upselling !== null}
                type={state.upselling ?? 'free-trial'}
                onClose={() => {
                    state.message?.onClose?.();
                    setState((prev) => ({ ...prev, upselling: null }));
                }}
            />

            <PendingShareAccessModal
                open={state.pendingShareAccess}
                onClose={() => {
                    state.message?.onClose?.();
                    setState((prev) => ({ ...prev, pendingShareAccess: false }));
                }}
            />
        </SpotlightContext.Provider>
    );
};

export const useSpotlightContext = () => useContext(SpotlightContext);

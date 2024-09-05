import type { FC, PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useInviteContext } from '@proton/pass/components/Invite/InviteContext';
import { PendingShareAccessModal } from '@proton/pass/components/Share/PendingShareAccessModal';
import type { UpsellType } from '@proton/pass/components/Upsell/UpsellingModal';
import { UpsellingModal } from '@proton/pass/components/Upsell/UpsellingModal';
import { UpsellRef } from '@proton/pass/constants';
import type { Callback, MaybeNull, OnboardingMessage } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import type { SpotlightMessageDefinition } from './SpotlightContent';
import { InviteIcon } from './SpotlightIcon';

type UpsellingState = { type: UpsellType; upsellRef: UpsellRef };

type SpotlightState = {
    open: boolean;
    upselling: MaybeNull<UpsellingState>;
    pendingShareAccess: boolean;
    message: MaybeNull<SpotlightMessageDefinition>;
};

export type SpotlightContextValue = {
    /** acknowledges the provided message type and executed the optional callback.
     * Will reset the SpotlightContext's current message to `null` */
    acknowledge: (messageType: OnboardingMessage, cb?: Callback) => void;
    /** Controls the Pending Share Access modal */
    setPendingShareAccess: (value: boolean) => void;
    /** Controls the Upselling modal */
    setUpselling: (value: MaybeNull<UpsellingState>) => void;
    /** Sets the current message - if an invite  */
    setOnboardingMessage: (message: MaybeNull<SpotlightMessageDefinition>) => void;
    state: SpotlightState;
};

const INITIAL_STATE: SpotlightState = { open: false, message: null, upselling: null, pendingShareAccess: false };

export const SpotlightContext = createContext<SpotlightContextValue>({
    acknowledge: noop,
    setUpselling: noop,
    setPendingShareAccess: noop,
    setOnboardingMessage: noop,
    state: INITIAL_STATE,
});

export const SpotlightProvider: FC<PropsWithChildren> = ({ children }) => {
    const { onboardingAcknowledge } = usePassCore();
    const { latestInvite, respondToInvite } = useInviteContext();

    const [state, setState] = useState<SpotlightState>(INITIAL_STATE);
    const [onboardingMessage, setOnboardingMessage] = useState<MaybeNull<SpotlightMessageDefinition>>(null);

    const timer = useRef<NodeJS.Timeout>();
    const messageRef = useRef(state.message);
    messageRef.current = state.message;

    const closeUpselling = () => {
        state.message?.onClose?.();
        setState((prev) => ({ ...prev, upselling: null }));
    };

    const closePendingShareAccess = () => {
        state.message?.onClose?.();
        setState((prev) => ({ ...prev, pendingShareAccess: false }));
    };

    const setMessage = useCallback((next: MaybeNull<SpotlightMessageDefinition>) => {
        if (messageRef.current?.id !== next?.id) {
            setState((curr) => ({ ...curr, open: false }));
            timer.current = setTimeout(
                () => setState((curr) => ({ ...curr, message: next, open: next !== null })),
                500
            );
        }
    }, []);

    const acknowledge = useCallback((messageType: OnboardingMessage, cb: Callback = noop) => {
        void onboardingAcknowledge?.(messageType);
        cb();
        setOnboardingMessage(null);
    }, []);

    const ctx = useMemo<SpotlightContextValue>(
        () => ({
            acknowledge,
            setPendingShareAccess: (pendingShareAccess) => setState((prev) => ({ ...prev, pendingShareAccess })),
            setUpselling: (upselling) => setState((prev) => ({ ...prev, upselling })),
            setOnboardingMessage,
            state,
        }),
        [state]
    );

    const inviteMessage = useMemo<MaybeNull<SpotlightMessageDefinition>>(
        () =>
            latestInvite && !latestInvite.fromNewUser
                ? {
                      id: latestInvite.token,
                      weak: true,
                      dense: false,
                      title: c('Title').t`Vault shared with you`,
                      message: c('Info').t`You're invited to a vault.`,
                      icon: InviteIcon,
                      action: {
                          label: c('Label').t`View details`,
                          type: 'button',
                          onClick: () => respondToInvite(latestInvite),
                      },
                  }
                : null,
        [latestInvite]
    );

    useEffect(() => () => clearTimeout(timer.current), []);

    useEffect(() => {
        /** For now, always prioritize invites over onboarding message */
        const activeMessage = inviteMessage ?? onboardingMessage;
        setMessage(activeMessage);
    }, [inviteMessage, onboardingMessage]);

    return (
        <SpotlightContext.Provider value={ctx}>
            {children}

            <UpsellingModal
                onClose={closeUpselling}
                open={state.upselling !== null}
                upsellType={state.upselling?.type ?? 'free-trial'}
                upsellRef={state.upselling?.upsellRef ?? UpsellRef.DEFAULT}
            />

            <PendingShareAccessModal open={state.pendingShareAccess} onClose={closePendingShareAccess} />
        </SpotlightContext.Provider>
    );
};

export const useSpotlight = () => useContext(SpotlightContext);

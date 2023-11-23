import type { FC } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useInviteContext } from '@proton/pass/components/Invite/InviteProvider';
import { PendingShareAccessModal } from '@proton/pass/components/Spotlight/PendingShareAccessModal';
import type { Callback, MaybeNull, OnboardingMessage } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import type { SpotlightMessageDefinition } from './SpotlightContent';
import { InviteIcon } from './SpotlightIcon';
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
    /** acknowledges the provided message type and executed the optional callback.
     * Will reset the SpotlightContext's current message to `null` */
    acknowledge: (messageType: OnboardingMessage, cb?: Callback) => void;
    /** Controls the Pending Share Access modal */
    setPendingShareAccess: (value: boolean) => void;
    /** Controls the Upselling modal */
    setUpselling: (value: MaybeNull<UpsellingModalType>) => void;
    /** Sets the current message - if an invite  */
    setOnboardingMessage: (message: MaybeNull<SpotlightMessageDefinition>) => void;
    state: SpotlightState;
    /** Flag indicating wether the spotlight should show : controlled by
     * a timeout to be able to animate entering/exiting animations.. */
    visible: boolean;
};

const INITIAL_STATE: SpotlightState = { open: false, message: null, upselling: null, pendingShareAccess: false };

export const SpotlightContext = createContext<SpotlightContextValue>({
    acknowledge: noop,
    setUpselling: noop,
    setPendingShareAccess: noop,
    setOnboardingMessage: noop,
    state: INITIAL_STATE,
    visible: false,
});

export const SpotlightProvider: FC = ({ children }) => {
    const { onOnboardingAck } = usePassCore();
    const timer = useRef<NodeJS.Timeout>();
    const [state, setState] = useState<SpotlightState>(INITIAL_STATE);

    /* keep a ref to the current message */
    const messageRef = useRef(state.message);
    messageRef.current = state.message;

    const { latestInvite, respondToInvite } = useInviteContext();
    const [onboardingMessage, setOnboardingMessage] = useState<MaybeNull<SpotlightMessageDefinition>>(null);

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
        onOnboardingAck?.(messageType);
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
            visible: state.open && !state.pendingShareAccess && !state.upselling,
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

export const useSpotlight = () => useContext(SpotlightContext);

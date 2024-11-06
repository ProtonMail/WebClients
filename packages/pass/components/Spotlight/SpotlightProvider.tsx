import type { FC, PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useInviteContext } from '@proton/pass/components/Invite/InviteContext';
import { PendingNewUsersApprovalModal } from '@proton/pass/components/Share/PendingNewUsersApprovalModal';
import { PendingShareAccessModal } from '@proton/pass/components/Share/PendingShareAccessModal';
import type { SpotlightMessageDefinition } from '@proton/pass/components/Spotlight/SpotlightContent';
import type { UpsellType } from '@proton/pass/components/Upsell/UpsellingModal';
import { UpsellingModal } from '@proton/pass/components/Upsell/UpsellingModal';
import type { UpsellRef } from '@proton/pass/constants';
import { type MaybeNull, SpotlightMessage } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import { InviteIcon } from './SpotlightIcon';

type UpsellingState = { type: UpsellType; upsellRef: UpsellRef };

type SpotlightState = {
    open: boolean;
    upselling: MaybeNull<UpsellingState>;
    pendingShareAccess: boolean;
    message: MaybeNull<SpotlightMessageDefinition>;
};

export type SpotlightContextValue = {
    /** Acknowledges the provided spotlight message type.
     * Resets the SpotlightContext's current message to `null` */
    acknowledge: (messageType: SpotlightMessage) => void;
    /** Controls the Pending Share Access modal */
    setPendingShareAccess: (value: boolean) => void;
    /** Controls the Upselling modal */
    setUpselling: (value: MaybeNull<UpsellingState>) => void;
    /** Sets the current message - if an invite  */
    setSpotlight: (message: MaybeNull<SpotlightMessageDefinition>) => void;
    state: SpotlightState;
};

const INITIAL_STATE: SpotlightState = { open: false, message: null, upselling: null, pendingShareAccess: false };

export const SpotlightContext = createContext<SpotlightContextValue>({
    acknowledge: noop,
    setUpselling: noop,
    setPendingShareAccess: noop,
    setSpotlight: noop,
    state: INITIAL_STATE,
});

export const SpotlightProvider: FC<PropsWithChildren> = ({ children }) => {
    const { spotlight } = usePassCore();
    const { latestInvite, respondToInvite } = useInviteContext();

    const [state, setState] = useState<SpotlightState>(INITIAL_STATE);
    const [spotlightMessage, setSpotlightMessage] = useState<MaybeNull<SpotlightMessageDefinition>>(null);

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

    const acknowledge = useCallback((spotlightMessageType: SpotlightMessage) => {
        void spotlight.acknowledge(spotlightMessageType);
        setSpotlightMessage(null);
    }, []);

    const ctx = useMemo<SpotlightContextValue>(
        () => ({
            acknowledge,
            setPendingShareAccess: (pendingShareAccess) => setState((prev) => ({ ...prev, pendingShareAccess })),
            setUpselling: (upselling) => setState((prev) => ({ ...prev, upselling })),
            setSpotlight: setSpotlightMessage,
            state,
        }),
        [state]
    );

    const inviteMessage = useMemo<MaybeNull<SpotlightMessageDefinition>>(
        () =>
            latestInvite && !latestInvite.fromNewUser
                ? {
                      type: SpotlightMessage.NOOP,
                      mode: 'default',
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
        /** For now, always prioritize invites over spotlight messages */
        const activeMessage = inviteMessage ?? spotlightMessage;
        setMessage(activeMessage);
    }, [inviteMessage, spotlightMessage]);

    return (
        <SpotlightContext.Provider value={ctx}>
            {children}

            {state.upselling && (
                <UpsellingModal
                    open
                    onClose={closeUpselling}
                    upsellType={state.upselling.type}
                    upsellRef={state.upselling.upsellRef}
                />
            )}

            <PendingShareAccessModal open={state.pendingShareAccess} onClose={closePendingShareAccess} />
            <PendingNewUsersApprovalModal />
        </SpotlightContext.Provider>
    );
};

export const useSpotlight = () => useContext(SpotlightContext);

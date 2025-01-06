import type { FC, PropsWithChildren } from 'react';
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useInviteActions, useLatestInvite } from '@proton/pass/components/Invite/InviteProvider';
import { PendingNewUsersApprovalModal } from '@proton/pass/components/Share/PendingNewUsersApprovalModal';
import { PendingShareAccessModal } from '@proton/pass/components/Share/PendingShareAccessModal';
import type { SpotlightMessageDefinition } from '@proton/pass/components/Spotlight/SpotlightContent';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { useStatefulRef } from '@proton/pass/hooks/useStatefulRef';
import { selectHasPendingShareAccess } from '@proton/pass/store/selectors';
import { type MaybeNull, SpotlightMessage } from '@proton/pass/types';

import { InviteIcon } from './SpotlightIcon';

type SpotlightState = {
    open: boolean;
    pendingShareAccess: boolean;
    message: MaybeNull<SpotlightMessageDefinition>;
};

export type SpotlightContextValue = {
    /** Acknowledges the provided spotlight message type.
     * Resets the SpotlightContext's current message to `null` */
    acknowledge: (messageType: SpotlightMessage) => void;
    /** Controls the Pending Share Access modal */
    setPendingShareAccess: (value: boolean) => void;
    /** Sets the current message - if an invite  */
    setSpotlight: (message: MaybeNull<SpotlightMessageDefinition>) => void;
    state: SpotlightState;
};

const INITIAL_STATE: SpotlightState = { open: false, message: null, pendingShareAccess: false };

export const SpotlightContext = createContext<MaybeNull<SpotlightContextValue>>(null);

export const SpotlightProvider: FC<PropsWithChildren> = ({ children }) => {
    const { spotlight } = usePassCore();
    const latestInvite = useLatestInvite();
    const { setInvite } = useInviteActions();

    const [state, setState] = useState<SpotlightState>(INITIAL_STATE);
    const [spotlightMessage, setSpotlightMessage] = useState<MaybeNull<SpotlightMessageDefinition>>(null);

    /** When spotlight message shows `PENDING_SHARE_ACCESS` from synchronous local
     * cache read on boot, and cache later invalidates asynchronously, the pending
     * access modal should close after cache updates with confirmed access. */
    const pendingShareAccess = useSelector(selectHasPendingShareAccess);
    const pendingShareAccessModalOpened = state.pendingShareAccess && pendingShareAccess;

    const timer = useRef<NodeJS.Timeout>();
    const messageRef = useStatefulRef(state.message);

    const closePendingShareAccess = () => {
        void spotlight.acknowledge(SpotlightMessage.PENDING_SHARE_ACCESS);
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
                          onClick: () => setInvite(latestInvite),
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
            <PendingShareAccessModal open={pendingShareAccessModalOpened} onClose={closePendingShareAccess} />
            <PendingNewUsersApprovalModal />
        </SpotlightContext.Provider>
    );
};

export const useSpotlight = createUseContext(SpotlightContext);

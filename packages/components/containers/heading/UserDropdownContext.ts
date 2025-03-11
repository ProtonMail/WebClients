import { type MouseEvent, type RefObject, createContext } from 'react';

import type { useAccountSessions } from '@proton/account/accountSessions';
import type AccountSessionsSwitcher from '@proton/components/containers/heading/AccountSessionsSwitcher';
import type { useReferral } from '@proton/components/containers/heading/useReferral';
import type { ForkType } from '@proton/shared/lib/authentication/fork';
import type { APP_NAMES } from '@proton/shared/lib/constants';

export interface UserDropdownValue {
    referral: ReturnType<typeof useReferral>;
    upgrade: {
        url: string;
        display: boolean;
    };
    info: {
        planName: string | undefined;
        email: string | undefined;
        name: string;
        organizationName: string;
        initials: string;
    };
    closeUserDropdown: () => void;
    onSignOut: () => void;
    onOpenBugReportModal: () => void;
    onOpenSignoutAll: () => void;
    onOpenChat?: () => void;
    accountSessions: ReturnType<typeof useAccountSessions>;
    onSwitchAccount: (event: MouseEvent<HTMLAnchorElement>, forkType: ForkType) => void;
    switchHref: string;
    loginHref: string;
    app: APP_NAMES;
    isOpen: boolean;
    anchorRef: RefObject<HTMLButtonElement>;
    sessionOptions?: Parameters<typeof AccountSessionsSwitcher>[0]['sessionOptions'];
    hasAppLinks?: boolean;
    onOpenHelpModal: () => void;
    showSwitchAccountButton: boolean;
}

export const UserDropdownContext = createContext({} as UserDropdownValue);

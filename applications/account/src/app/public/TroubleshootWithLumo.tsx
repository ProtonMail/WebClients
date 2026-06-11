import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useTheme } from '@proton/components';
import { IcCross } from '@proton/icons/icons/IcCross';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoCatIcon from '@proton/styles/assets/img/lumo/lumo-cat-icon.svg';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import './TroubleshootWithLumo.scss';

// Opens the minimal Lumo "agent" surface pre-loaded with the account-protection agent. Using
// getAppHref keeps the host correct per environment (e.g. lumo.proton.me vs lumo.proton.dev).
// `theme` makes the embedded Lumo surface match this page's light/dark appearance.
const buildLumoSrc = (theme: 'light' | 'dark') =>
    getAppHref(`/agent?skill=proton-account-recovery&theme=${theme}`, APPS.PROTONLUMO);

// Lets other parts of the sign-in surface (e.g. the "Get help from Lumo" link in the login form)
// open this panel even though they live in a separate React subtree.
export const TROUBLESHOOT_WITH_LUMO_OPEN_EVENT = 'proton:troubleshoot-with-lumo:open';

export const openTroubleshootWithLumo = () => {
    window.dispatchEvent(new CustomEvent(TROUBLESHOOT_WITH_LUMO_OPEN_EVENT));
};

// Bottom-right entry point on the sign-in page. Opens the account-protection Lumo agent in a
// floating, non-blocking panel. Unlike a modal, the panel lets users keep following recovery
// steps on the page while the chat stays open, and the iframe is kept mounted across close/reopen
// so the conversation is preserved (we only toggle visibility instead of unmounting).
const TroubleshootWithLumo = () => {
    const [isOpen, setIsOpen] = useState(false);
    // Resolved once on first open: this lazy-loads the iframe AND freezes its `src`, so a later
    // theme toggle on the host page can't reload it and wipe the conversation.
    const [src, setSrc] = useState<string | undefined>(undefined);
    const theme = useTheme();
    const lumoSignInHelperEnabled = useFlag('LumoSignInHelp');

    const title = c('Title').t`Troubleshoot with ${LUMO_SHORT_APP_NAME}`;

    const open = () => {
        if (!src) {
            setSrc(buildLumoSrc(theme.information.dark ? 'dark' : 'light'));
        }
        setIsOpen(true);
    };

    // Allows external entry points (e.g. the login form's "Get help from Lumo" link) to open the
    // panel. Only wired up when the feature is enabled so the event is a no-op otherwise.
    useEffect(() => {
        if (!lumoSignInHelperEnabled) {
            return;
        }
        window.addEventListener(TROUBLESHOOT_WITH_LUMO_OPEN_EVENT, open);
        return () => window.removeEventListener(TROUBLESHOOT_WITH_LUMO_OPEN_EVENT, open);
    });

    // Gated behind the rollout flag: when off, no Lumo entry point appears on the sign-in page.
    if (!lumoSignInHelperEnabled) {
        return null;
    }

    return (
        <div className="relative inline-block text-left">
            {src && (
                <div
                    role="dialog"
                    aria-label={title}
                    aria-hidden={!isOpen}
                    className={clsx(
                        'lumo-troubleshoot-panel absolute z-50 bg-norm border border-weak rounded-xl sm:shadow-lifted shadow-color-primary overflow-hidden flex flex-column flex-nowrap',
                        isOpen && 'is-open'
                    )}
                >
                    <div className="flex flex-row flex-nowrap items-center gap-2 px-3 py-2 border-bottom border-weak shrink-0">
                        <span className="lumo-troubleshoot-avatar flex items-center justify-center rounded-full bg-weak shrink-0 ratio-square">
                            <img src={lumoCatIcon} alt="" aria-hidden="true" className="lumo-troubleshoot-avatar-icon" />
                        </span>
                        <span className="text-semibold text-ellipsis flex-1">{title}</span>
                        <Button
                            icon
                            shape="ghost"
                            size="small"
                            className="shrink-0"
                            onClick={() => setIsOpen(false)}
                            title={c('Action').t`Close`}
                        >
                            <IcCross />
                        </Button>
                    </div>
                    <iframe
                        title={title}
                        src={src}
                        className="w-full flex-1 border-none"
                        allow="clipboard-write"
                    />
                </div>
            )}
            <button
                type="button"
                className="lumo-troubleshoot-launcher link-focus inline-flex items-center gap-2 rounded-full bg-norm border border-weak shadow-norm color-norm py-1 pl-1 pr-3"
                aria-expanded={isOpen}
                onClick={() => (isOpen ? setIsOpen(false) : open())}
            >
                <span className="lumo-troubleshoot-avatar flex items-center justify-center rounded-full bg-weak shrink-0 ratio-square">
                    <img src={lumoCatIcon} alt="" aria-hidden="true" className="lumo-troubleshoot-avatar-icon" />
                </span>
                <span className="text-sm text-semibold">{c('Action').t`Get help from ${LUMO_SHORT_APP_NAME}`}</span>
            </button>
        </div>
    );
};

export default TroubleshootWithLumo;

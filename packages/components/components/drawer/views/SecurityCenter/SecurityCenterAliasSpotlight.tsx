import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { useHandler } from '@proton/hooks/useHandler';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { isAppInView } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';

import useDrawer from '../../../../hooks/drawer/useDrawer';
import useActiveBreakpoint from '../../../../hooks/useActiveBreakpoint';
import Spotlight from '../../../spotlight/Spotlight';

interface Props {
    show: boolean;
    onClose: () => void;
    /**
     * Called once the bubble is on screen, so the app can record that it has shown
     */
    onDisplayed?: () => void;
    children: ReactNode;
}

/**
 * Shown by the app after a moment it chooses (Mail: after the inbox cleanup), so `show` is passed straight to
 * `Spotlight` instead of going through `useSpotlightShow`: that hook only lets the first spotlight of the page
 * load appear, and this one must appear even if another spotlight already did.
 */
const SecurityCenterAliasSpotlight = ({ show, onClose, onDisplayed, children }: Props) => {
    const anchorRef = useRef<HTMLDivElement>(null);
    const { toggleDrawerApp, appInView } = useDrawer();
    const { viewportWidth } = useActiveBreakpoint();

    // Stable, so the effect below only reruns when `show` changes (the app passes a new `onClose` on every render)
    const closeOnUnmount = useHandler(onClose);

    useEffect(() => {
        if (!show) {
            return;
        }
        // Clears the request if the button unmounts while the spotlight shows (e.g. the side panel is hidden).
        // It also runs when `show` turns false after a normal close, which just clears it again.
        return () => {
            closeOnUnmount();
        };
    }, [show]);

    const handleCreateAlias = () => {
        // toggleDrawerApp would close Security center if it's already open
        if (!isAppInView(DRAWER_NATIVE_APPS.SECURITY_CENTER, appInView)) {
            toggleDrawerApp({ app: DRAWER_NATIVE_APPS.SECURITY_CENTER })();
        }
        onClose();
    };

    // Clicking the Security center button it points at also dismisses the bubble
    const handleSecurityCenterButtonClick = () => {
        if (show) {
            onClose();
        }
    };

    return (
        <Spotlight
            originalPlacement="left"
            show={show && !viewportWidth['<=small']}
            onDisplayed={onDisplayed}
            onClose={() => onClose()}
            anchorRef={anchorRef}
            type="new"
            content={
                <>
                    <p className="m-0 text-bold">{c('Spotlight').t`Signing up for something new?`}</p>
                    <p className="m-0">{c('Spotlight')
                        .t`Use a ${MAIL_APP_NAME} alias instead of your real address. Newsletters still reach you, and you can turn the alias off anytime.`}</p>
                    <p className="m-0 mt-1">
                        <InlineLinkButton onClick={handleCreateAlias}>{c('Action')
                            .t`Create an alias`}</InlineLinkButton>
                    </p>
                </>
            }
        >
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div ref={anchorRef} onClick={handleSecurityCenterButtonClick}>
                {children}
            </div>
        </Spotlight>
    );
};

export default SecurityCenterAliasSpotlight;

import { type CSSProperties, type ReactNode, useState } from 'react';

import { useFlagsStatus } from '@unleash/proxy-client-react';
import { c } from 'ttag';

import { useBYOEGating } from '@proton/activation/src/byoe/useBYOEGating';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { loadSyncList } from '@proton/activation/src/logic/sync/sync.actions';
import { selectSyncListLoadingState } from '@proton/activation/src/logic/sync/sync.selectors';
import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';

const fullScreenStyle = { '--min-h-custom': 'calc(100dvh - 2rem)' } as CSSProperties;

interface Props {
    children: ReactNode;
}

/**
 * Renders nothing but a loader until everything the BYOE screen decides on is known: the user, the entitlements,
 * the addresses, the forwardings and the feature flags. Without it, the gating runs on partial data (flags default
 * to off) and the screen shows a "feature disabled" or limit state, or a toast, before the Google redirect.
 */
export const BYOEMobileGate = ({ children }: Props) => {
    const { isLoadingGating } = useBYOEGating();
    const { flagsReady, flagsError } = useFlagsStatus();
    const syncListState = useEasySwitchSelector(selectSyncListLoadingState);
    const dispatch = useEasySwitchDispatch();

    // If the flags failed to load, don't block forever: carry on with the flags at their defaults
    const isReady = !isLoadingGating && (flagsReady || !!flagsError);

    // Latched: reloading the syncs later (event loop, dashboard) must not unmount the screen and lose its state
    const [hasBeenReady, setHasBeenReady] = useState(false);
    if (isReady && !hasBeenReady) {
        setHasBeenReady(true);
    }

    if (hasBeenReady || isReady) {
        return <>{children}</>;
    }

    // A failed forwardings request keeps the gating loading forever, so offer a retry instead of an endless loader
    if (syncListState === 'failed') {
        return (
            <div
                className="flex flex-column items-center justify-center gap-4 px-4 text-center min-h-custom"
                style={fullScreenStyle}
                role="alert"
            >
                <p className="m-0 text-lg color-weak">{c('Error').t`Couldn't load your account`}</p>
                <Button
                    shape="solid"
                    color="weak"
                    pill
                    onClick={() => {
                        dispatch(loadSyncList());
                    }}
                >
                    {c('Action').t`Try again`}
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-custom" style={fullScreenStyle}>
            <CircleLoader size="large" />
        </div>
    );
};

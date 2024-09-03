import { type FC, useEffect, useState } from 'react';

import { RUNTIME_RELOAD_THROTTLE } from 'proton-pass-extension/app/worker/services/activation';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import type { IconName } from '@proton/components/components/icon';
import { Icon } from '@proton/components/components/icon';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { LobbyLayout } from '@proton/pass/components/Layout/Lobby/LobbyLayout';
import browser from '@proton/pass/lib/globals/browser';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { getBrowser } from '@proton/shared/lib/helpers/browser';
import { wait } from '@proton/shared/lib/helpers/promise';

export const getBrowserIcon = (): IconName => {
    switch (getBrowser().name) {
        case 'Brave':
            return 'brand-brave';
        case 'Chrome':
            return 'brand-chrome';
        case 'Firefox':
            return 'brand-firefox';
        case 'Edge':
            return 'brand-edge';
        case 'Safari':
        case 'Mobile Safari':
            return 'brand-safari';
        default:
            return 'brand-proton-pass';
    }
};

type Props = {
    autoReload?: boolean;
    browserError?: boolean;
    message: string;
};

/** When `autoReload` is set, we will attempt to reload the runtime
 * without showing the underlying message to the user */
export const PromptForReload: FC<Props> = ({ autoReload, browserError, message }) => {
    const { onForceUpdate } = usePassCore();
    const [reloadCTA, showReloadCTA] = useState(!autoReload);

    useEffect(() => {
        if (autoReload) {
            const now = getEpoch();

            browser.storage.local
                .get('lastReload')
                .then(async ({ lastReload = 0 }) => {
                    if (lastReload + RUNTIME_RELOAD_THROTTLE > now) throw new Error();

                    await wait(2_000); /* small delay to avoid safari limbo state */
                    await browser.storage.local.set({ lastReload: now });
                    return browser.runtime.reload();
                })
                .catch(() => showReloadCTA(true));
        }
    }, [autoReload]);

    return reloadCTA ? (
        <div
            key="prompt-for-reload"
            className="w-full flex-1 items-center flex flex-column items-center gap-2 anime-fade-in"
        >
            {browserError && (
                <div className="relative">
                    <Icon
                        name="exclamation-circle-filled"
                        size={4.5}
                        color="var(--signal-danger)"
                        className="absolute bg-strong rounded-xl"
                    />
                    <Icon name={getBrowserIcon()} size={14} />
                </div>
            )}

            <span className="block text-sm text-weak mt-2 mb-4">{message}</span>
            <Button pill shape="solid" color="weak" className="ui-red w-full" onClick={onForceUpdate}>
                {c('Action').t`Reload extension`}
            </Button>
        </div>
    ) : (
        <div
            key="lobby-loading"
            className="flex flex-column items-center gap-3 mt-12 w-full anime-fade-in"
            style={{ '--anime-delay': '250ms' }}
        >
            <CircleLoader size="small" />
            <span className="block text-sm text-weak">{c('Info').t`Loading ${PASS_APP_NAME}`}</span>
        </div>
    );
};

export const ExtensionError: FC = () => (
    <LobbyLayout overlay>
        <PromptForReload
            message={c('Error')
                .t`Something went wrong. Please reload the ${PASS_APP_NAME} extension. This issue has been logged`}
        />
    </LobbyLayout>
);

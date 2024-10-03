import { type FC, useEffect, useState } from 'react';

import { reloadManager } from 'proton-pass-extension/lib/utils/reload';
import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import type { IconName } from '@proton/components';
import { Icon } from '@proton/components';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { LobbyLayout } from '@proton/pass/components/Layout/Lobby/LobbyLayout';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { getBrowser } from '@proton/shared/lib/helpers/browser';

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
        if (autoReload) reloadManager.runtimeReload().catch(() => showReloadCTA(true));
    }, [autoReload]);

    return reloadCTA ? (
        <div
            key="prompt-for-reload"
            className="w-full flex-1 flex-nowrap items-center flex flex-column items-center gap-5 anime-fade-in"
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

            <div>
                {message.split('\n').map((part, idx) => (
                    <span key={`message-${idx}`} className="block text-sm text-weak mt-1">
                        {part}
                    </span>
                ))}
            </div>

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

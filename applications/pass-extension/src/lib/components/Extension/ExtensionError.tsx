import { type FC, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import type { IconComponent } from '@proton/icons/component';
import { IcBrandBrave } from '@proton/icons/icons/IcBrandBrave';
import { IcBrandChrome } from '@proton/icons/icons/IcBrandChrome';
import { IcBrandEdge } from '@proton/icons/icons/IcBrandEdge';
import { IcBrandFirefox } from '@proton/icons/icons/IcBrandFirefox';
import { IcBrandProtonPass } from '@proton/icons/icons/IcBrandProtonPass';
import { IcBrandSafari } from '@proton/icons/icons/IcBrandSafari';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { LobbyLayout } from '@proton/pass/components/Layout/Lobby/LobbyLayout';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { getBrowser } from '@proton/shared/lib/helpers/browser';

import { reloadManager } from '../../utils/reload';

const getBrowserIcon = (): IconComponent => {
    switch (getBrowser().name) {
        case 'Brave':
            return IcBrandBrave;
        case 'Chrome':
            return IcBrandChrome;
        case 'Firefox':
            return IcBrandFirefox;
        case 'Edge':
            return IcBrandEdge;
        case 'Safari':
        case 'Mobile Safari':
            return IcBrandSafari;
        default:
            return IcBrandProtonPass;
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

    const BrowserIcon = getBrowserIcon();

    return reloadCTA ? (
        <div
            key="prompt-for-reload"
            className="w-full flex-1 flex-nowrap items-center flex flex-column items-center gap-5 anime-fade-in"
        >
            {browserError && (
                <div className="relative">
                    <IcExclamationCircleFilled
                        size={4.5}
                        color="var(--signal-danger)"
                        className="absolute bg-strong rounded-xl"
                    />
                    <BrowserIcon size={14} />
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
    <LobbyLayout>
        <PromptForReload
            message={c('Error')
                .t`Something went wrong. Please reload the ${PASS_APP_NAME} extension. This issue has been logged`}
        />
    </LobbyLayout>
);

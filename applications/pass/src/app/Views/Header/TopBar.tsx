import { type FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import brave from '@proton/pass/assets/import/brave-icon-48.png';
import chrome from '@proton/pass/assets/import/chrome-icon-48.png';
import edge from '@proton/pass/assets/import/edge-icon-48.png';
import firefox from '@proton/pass/assets/import/firefox-icon-48.png';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { usePassExtensionLink } from '@proton/pass/components/Core/PassExtensionLink';
import type { SupportedExtensionClient } from '@proton/pass/lib/extension/utils/browser';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { Clients, clients } from '@proton/shared/lib/pass/constants';
import clsx from '@proton/utils/clsx';

const BrowserImages: Record<SupportedExtensionClient, string> = {
    [Clients.Brave]: brave,
    [Clients.Chrome]: chrome,
    [Clients.Edge]: edge,
    [Clients.Firefox]: firefox,
};

export const TopBar: FC = () => {
    const { onLink } = usePassCore();
    const { installed, supportedBrowser } = usePassExtensionLink();
    const browser = supportedBrowser ? clients[supportedBrowser] : null;

    return supportedBrowser && browser ? (
        <div className={clsx('anime-reveal hidden md:block text-sm', installed && 'anime-reveal--hidden')}>
            <div className="flex gap-2 shrink-0 flex-1 items-center px-3 py-2 pass-spotlight-content weak">
                <img src={BrowserImages[supportedBrowser]} width="24" height="24" alt="" />
                <span>
                    {
                        // translator: Install Proton Pass for Brave to quickly autofill your logins.
                        c('Info').t`Install ${PASS_APP_NAME} for ${browser.title} to quickly autofill your logins. `
                    }
                </span>
                <Button pill size="small" shape="solid" color="norm" onClick={() => onLink(browser.link)}>
                    {c('Action').t`Install extension`}
                </Button>
            </div>
        </div>
    ) : null;
};

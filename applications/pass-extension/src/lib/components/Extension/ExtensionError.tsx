import type { VFC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { LobbyLayout } from '@proton/pass/components/Layout/Lobby/LobbyLayout';
import browser from '@proton/pass/lib/globals/browser';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

/* This component uses buttons leveraging `ui-orange` &
 * `ui-red` themes because we don't currently
 * support weak & danger|warning buttons */
export const PromptForReload: VFC<{ message: string }> = ({ message }) => (
    <div key="prompt-for-reload" className="mt-12 w-full flex flex-column flex-align-items-center gap-2 anime-fade-in">
        <span className="block text-sm text-weak">{message}</span>

        <Button pill shape="solid" color="weak" className="ui-red w-full" onClick={() => browser.runtime.reload()}>
            {c('Action').t`Reload extension`}
        </Button>
    </div>
);

export const ExtensionError: VFC = () => (
    <LobbyLayout overlay>
        <PromptForReload
            message={c('Error')
                .t`Something went wrong. Please reload the ${PASS_APP_NAME} extension. This issue has been logged`}
        />
    </LobbyLayout>
);

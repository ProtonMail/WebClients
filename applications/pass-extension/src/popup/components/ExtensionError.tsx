import type { VFC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import browser from '@proton/pass/globals/browser';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { FadeIn } from '../../shared/components/animation/FadeIn';
import { LobbyLayout } from '../views/Lobby/LobbyLayout';

/* This component uses buttons leveraging `ui-orange` &
 * `ui-red` themes because we don't currently
 * support weak & danger|warning buttons */
export const PromptForReload: VFC<{ message: string }> = ({ message }) => (
    <FadeIn className="mt-12 w100 flex flex-column flex-align-items-center gap-2" key="prompt-for-reload">
        <span className="block text-sm text-weak">{message}</span>

        <Button pill shape="solid" color="weak" className="ui-red w100" onClick={() => browser.runtime.reload()}>
            {c('Action').t`Reload extension`}
        </Button>
    </FadeIn>
);

export const ExtensionError: VFC = () => (
    <LobbyLayout overlay>
        <PromptForReload
            message={c('Error')
                .t`Something went wrong. Please reload the ${PASS_APP_NAME} extension. This issue has been logged`}
        />
    </LobbyLayout>
);

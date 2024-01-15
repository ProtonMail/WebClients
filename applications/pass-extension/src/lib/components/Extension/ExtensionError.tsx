import type { VFC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { LobbyLayout } from '@proton/pass/components/Layout/Lobby/LobbyLayout';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

/* This component uses buttons leveraging `ui-orange` &
 * `ui-red` themes because we don't currently
 * support weak & danger|warning buttons */
export const PromptForReload: VFC<{ message: string }> = ({ message }) => {
    const { onForceUpdate } = usePassCore();

    return (
        <div key="prompt-for-reload" className="mt-12 w-full flex flex-column items-center gap-2 anime-fade-in">
            <span className="block text-sm text-weak">{message}</span>

            <Button pill shape="solid" color="weak" className="ui-red w-full" onClick={onForceUpdate}>
                {c('Action').t`Reload extension`}
            </Button>
        </div>
    );
};

export const ExtensionError: VFC = () => (
    <LobbyLayout overlay>
        <PromptForReload
            message={c('Error')
                .t`Something went wrong. Please reload the ${PASS_APP_NAME} extension. This issue has been logged`}
        />
    </LobbyLayout>
);

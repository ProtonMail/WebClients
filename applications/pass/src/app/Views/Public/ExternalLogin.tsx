import type { FC } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcChevronLeft } from '@proton/icons/icons/IcChevronLeft';
import { LobbyLayout } from '@proton/pass/components/Layout/Lobby/LobbyLayout';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

/** Full-page waiting state shown in the desktop app while sign-in
 * happens in the external browser. The deep-link auth callback
 * navigates away from this route once the fork comes back. Only
 * reachable in desktop builds. */
export const ExternalLogin: FC = () => {
    const history = useHistory();

    return (
        <LobbyLayout>
            <div className="flex flex-column items-center gap-4 mt-12">
                <span className="text-bold text-lg">{c('Title').t`Continue in your browser`}</span>
                <span className="text-weak">
                    {c('Info')
                        .t`Finish signing in in the browser window that just opened. ${PASS_APP_NAME} will pick up automatically once you're done.`}
                </span>
                {DESKTOP_BUILD && window.ctxBridge && (
                    <Button pill shape="ghost" color="weak" onClick={() => history.goBack()}>
                        <IcChevronLeft className="mr-1" />
                        {c('Action').t`Go back`}
                    </Button>
                )}
            </div>
        </LobbyLayout>
    );
};

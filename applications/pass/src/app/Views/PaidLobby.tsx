import { c } from 'ttag';

import { Button } from '@proton/atoms';
import passBrandText from '@proton/pass/assets/protonpass-brand.svg';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { LobbyLayout } from '@proton/pass/components/Layout/Lobby/LobbyLayout';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export const PaidLobby = () => {
    const { onLink, config } = usePassCore();
    const brandNameJSX = (
        <img
            src={passBrandText}
            className="pass-lobby--brand-text ml-2 h-custom"
            style={{ '--h-custom': '1.5rem' }}
            key="brand"
            alt=""
        />
    );

    return (
        <LobbyLayout overlay>
            <div key="lobby" className="anime-fade-in" style={{ '--anime-delay': '250ms' }}>
                <div className="flex flex-column items-center gap-3">
                    <span className="pass-lobby--heading text-bold text-norm flex items-end justify-center user-select-none">
                        {c('Title').jt`Welcome to ${brandNameJSX}`}
                    </span>
                    <span className="text-norm">
                        {c('Info').jt`Please upgrade to have early access to ${PASS_APP_NAME} web app`}
                    </span>
                </div>

                <div className="flex-1 mt-8 flex flex-column gap-2">
                    <Button
                        pill
                        shape="solid"
                        color="norm"
                        className="w-full"
                        onClick={() => onLink(`${config.SSO_URL}/pass/upgrade`)}
                    >
                        {c('Action').t`Get upgrade`}
                    </Button>
                    <Button
                        pill
                        shape="solid"
                        color="weak"
                        className="w-full"
                        onClick={() => onLink(`${config.SSO_URL}`)}
                    >
                        {c('Action').t`Sign out`}
                    </Button>
                </div>
            </div>
        </LobbyLayout>
    );
};

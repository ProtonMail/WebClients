import { type FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { LobbyLayout } from '@proton/pass/components/Layout/Lobby/LobbyLayout';
import { LockSetup } from '@proton/pass/components/Settings/LockSetup';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

type Props = { onCancel: () => void };

export const LockOnboarding: FC<Props> = ({ onCancel }) => (
    <LobbyLayout overlay>
        <div
            key="lock-setup"
            className="anime-fade-in flex flex-nowrap shrink-0 flex-column gap-5"
            style={{ '--anime-delay': '250ms' }}
        >
            <div className="flex gap-3 justify-center text-semibold">
                <Icon name="pass-lock" size={10} className="md:block hidden" />
                <span>{c('Info').t`Your organization requires you to secure your access to ${PASS_APP_NAME}`}</span>
            </div>

            <div>
                <Card className="text-left">
                    <LockSetup noTTL />
                </Card>

                <Button className="w-full text-sm my-2" color="weak" onClick={onCancel} pill shape="ghost">
                    {c('Action').t`Sign out`}
                </Button>
            </div>
        </div>
    </LobbyLayout>
);

import { useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import type { ModalProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components';
import { useErrorHandler } from '@proton/components/hooks';
import type { LocalSessionResponse } from '@proton/shared/lib/authentication/interface';
import type { LocalSessionPersisted } from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { User } from '@proton/shared/lib/interfaces';

import AccountSwitcherItem from './AccountSwitcherItem';

interface Props extends ModalProps {
    onSwitchSession: (session: LocalSessionPersisted) => Promise<void>;
    sessions: LocalSessionPersisted[] | undefined;
    user: User | undefined;
}

const SwitchModal = ({ onSwitchSession, user, sessions = [], ...rest }: Props) => {
    const errorHandler = useErrorHandler();
    const [tmpUser, setTmpUser] = useState<LocalSessionResponse | null>(null);
    return (
        <ModalTwo size="small" {...rest} onClose={tmpUser ? undefined : rest.onClose}>
            <ModalTwoHeader title={c('Title').t`Switch account`} titleClassName="text-4xl mb-1" />
            <ModalTwoContent>
                <div className="flex flex-column gap-1 pb-2">
                    {sessions
                        .filter((session) => session.remote.UserID !== user?.ID)
                        .map((session) => {
                            const user = {
                                ID: session.remote.UserID,
                                Name: session.remote.Username,
                                Email: session.remote.PrimaryEmail,
                                DisplayName: session.remote.DisplayName,
                            };
                            return (
                                <AccountSwitcherItem
                                    key={session.remote.LocalID}
                                    border={false}
                                    onClick={() => {
                                        if (tmpUser) {
                                            return;
                                        }
                                        const run = async () => {
                                            setTmpUser(session.remote);
                                            try {
                                                await onSwitchSession(session);
                                            } catch (e) {
                                                errorHandler(e);
                                            } finally {
                                                setTmpUser(null);
                                            }
                                        };

                                        void run();
                                    }}
                                    as="button"
                                    user={user}
                                    className="w-full interactive"
                                    right={tmpUser?.LocalID === session.remote.LocalID ? <CircleLoader /> : undefined}
                                />
                            );
                        })}
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default SwitchModal;

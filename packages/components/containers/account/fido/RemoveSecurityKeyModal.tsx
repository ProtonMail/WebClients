import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import AuthModal from '@proton/components/containers/password/AuthModal';
import { useLoading } from '@proton/hooks';
import { removeSecurityKey } from '@proton/shared/lib/api/settings';
import { lockSensitiveSettings, unlockPasswordChanges } from '@proton/shared/lib/api/user';
import noop from '@proton/utils/noop';

import { useApi, useEventManager, useNotifications } from '../../../hooks';

interface Key {
    id: string;
    name: string;
}

interface Props extends ModalProps {
    type: 'single' | 'all';
    keys: Key[];
}

const RemoveSecurityKeyModal = ({ onClose, type, keys, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();
    const api = useApi();
    const { call } = useEventManager();
    const [authModalProps, setAuthModalOpen, renderAuthModal] = useModalState();
    const { createNotification } = useNotifications();

    const name = (
        <span className="text-bold text-break" key="name">
            {keys[0].name}
        </span>
    );

    return (
        <>
            {renderAuthModal && (
                <AuthModal
                    config={unlockPasswordChanges()}
                    {...authModalProps}
                    onCancel={onClose}
                    onSuccess={async () => {
                        await Promise.all(
                            keys.map((key) => {
                                return api(removeSecurityKey(key.id)).catch(noop);
                            })
                        );
                        await api(lockSensitiveSettings());
                        await withLoading(
                            call().then(() => {
                                if (type === 'single') {
                                    createNotification({ text: c('fido2: Info').t`Security key removed` });
                                } else if (type === 'all') {
                                    createNotification({ text: c('fido2: Info').t`2FA via security key disabled` });
                                }
                                onClose?.();
                            })
                        );
                    }}
                />
            )}
            <Prompt
                {...rest}
                title={
                    type === 'all'
                        ? c('fido2: Title').t`Disable 2FA via security key?`
                        : c('fido2: Title').t`Delete security key?`
                }
                onClose={onClose}
                buttons={[
                    <Button
                        loading={loading}
                        color="danger"
                        onClick={() => {
                            setAuthModalOpen(true);
                        }}
                    >
                        {type === 'all' && c('Action').t`Disable`}
                        {type === 'single' && c('fido2: Action').t`Delete key`}
                    </Button>,
                    <Button disabled={loading} onClick={onClose}>
                        {c('Action').t`Cancel`}
                    </Button>,
                ]}
            >
                {type === 'all' && c('fido2: Info').t`This will delete all security keys linked to your account.`}
                {type === 'single' && c('fido2: Info').jt`Are you sure you want to delete security key ${name}?`}
            </Prompt>
        </>
    );
};

export default RemoveSecurityKeyModal;

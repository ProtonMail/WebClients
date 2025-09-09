import { c } from 'ttag';

import { userSettingsThunk } from '@proton/account/userSettings';
import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import AuthModal from '@proton/components/containers/password/AuthModal';
import useApi from '@proton/components/hooks/useApi';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities/asyncModelThunk/interface';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { removeSecurityKey } from '@proton/shared/lib/api/settings';
import { lockSensitiveSettings, unlockPasswordChanges } from '@proton/shared/lib/api/user';

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
    const normalApi = useApi();
    const dispatch = useDispatch();
    const [authModalProps, setAuthModalOpen, renderAuthModal] = useModalState();
    const { createNotification } = useNotifications();
    const handleError = useErrorHandler();

    const name = (
        <span className="text-bold text-break" key="name">
            {keys[0].name}
        </span>
    );

    return (
        <>
            {renderAuthModal && (
                <AuthModal
                    scope="password"
                    config={unlockPasswordChanges()}
                    {...authModalProps}
                    onCancel={onClose}
                    onSuccess={async () => {
                        const run = async () => {
                            try {
                                const api = getSilentApi(normalApi);
                                await Promise.all(
                                    keys.map((key) => {
                                        return api(removeSecurityKey(key.id));
                                    })
                                );
                                await api(lockSensitiveSettings());
                                await dispatch(userSettingsThunk({ cache: CacheType.None }));
                                if (type === 'single') {
                                    createNotification({ text: c('fido2: Info').t`Security key removed` });
                                } else if (type === 'all') {
                                    createNotification({ text: c('fido2: Info').t`2FA via security key disabled` });
                                }
                                onClose?.();
                            } catch (e) {
                                handleError(e);
                            }
                        };
                        void withLoading(run());
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

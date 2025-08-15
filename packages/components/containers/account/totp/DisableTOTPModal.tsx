import { c } from 'ttag';

import { userSettingsThunk } from '@proton/account/userSettings';
import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import AuthModal from '@proton/components/containers/password/AuthModal';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import { disableTotp } from '@proton/shared/lib/api/settings';

const DisableTOTPModal = ({ onClose, ...rest }: ModalProps) => {
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [authModalProps, setAuthModalOpen, renderAuthModal] = useModalState();

    return (
        <>
            {renderAuthModal && (
                <AuthModal
                    scope="password"
                    config={disableTotp()}
                    {...authModalProps}
                    onCancel={onClose}
                    onSuccess={async () => {
                        await withLoading(dispatch(userSettingsThunk({ cache: CacheType.None })));
                        onClose?.();
                        createNotification({ text: c('Info').t`Two-factor authentication disabled` });
                    }}
                />
            )}
            <Prompt
                {...rest}
                title={c('Title').t`Disable two-factor authentication`}
                onClose={onClose}
                buttons={[
                    <Button
                        loading={loading}
                        color="danger"
                        onClick={() => {
                            setAuthModalOpen(true);
                        }}
                    >
                        {c('Action').t`Disable`}
                    </Button>,
                    <Button disabled={loading} onClick={onClose}>
                        {c('Action').t`Cancel`}
                    </Button>,
                ]}
            >
                {c('Info')
                    .t`Disabling two-factor authentication will make your account less secure. Only proceed if absolutely necessary.`}
            </Prompt>
        </>
    );
};

export default DisableTOTPModal;

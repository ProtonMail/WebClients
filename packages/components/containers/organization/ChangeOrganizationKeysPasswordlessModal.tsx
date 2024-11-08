import { useEffect, useState } from 'react';

import { c } from 'ttag';

import type { OrganizationKeyRotationPayload } from '@proton/account';
import { getKeyRotationPayload, rotatePasswordlessOrganizationKeys } from '@proton/account';
import { Button, CircleLoader } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import AuthModal from '@proton/components/containers/password/AuthModal';
import useApi from '@proton/components/hooks/useApi';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';

import useVerifyOutboundPublicKeys from '../keyTransparency/useVerifyOutboundPublicKeys';
import AdministratorList from './AdministratorList';

interface ChangeProps extends Omit<ModalProps, 'children' | 'title' | 'buttons'> {
    mode?: 'reset';
}

export const ChangeOrganizationKeysPasswordlessModal = ({ onClose, mode, ...rest }: ChangeProps) => {
    const dispatch = useDispatch();
    const [config, setConfig] = useState<any>();
    const [loading, withLoading] = useLoading();
    const [loadingInit, withLoadingInit] = useLoading(true);
    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();
    const api = useApi();
    const silentApi = getSilentApi(api);
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [authModalProps, setAuthModal, renderAuthModal] = useModalState();
    const [result, setResult] = useState<null | OrganizationKeyRotationPayload>(null);
    const errorHandler = useErrorHandler();

    useEffect(() => {
        const run = async () => {
            setResult(null);
            const result = await dispatch(getKeyRotationPayload({ verifyOutboundPublicKeys, api: silentApi }));
            setResult(result);
        };
        withLoadingInit(run()).catch(errorHandler);
    }, []);

    const handleSubmit = async (result: OrganizationKeyRotationPayload) => {
        setConfig(undefined);
        const config = await dispatch(rotatePasswordlessOrganizationKeys(result));
        setConfig(config);
        setAuthModal(true);
    };

    const title = (() => {
        if (mode === 'reset') {
            return c('passwordless').t`Reset organization key`;
        }
        return c('passwordless').t`Change organization key`;
    })();

    const confirmText = c('passwordless').t`Are you sure you want to change your organization key?`;

    return (
        <>
            {renderAuthModal && config && (
                <AuthModal
                    scope="password"
                    {...authModalProps}
                    config={config}
                    onCancel={() => {
                        setAuthModal(false);
                    }}
                    onExit={() => setConfig(undefined)}
                    onSuccess={async () => {
                        await call();
                        createNotification({ text: c('passwordless').t`Organization key updated` });
                        onClose?.();
                    }}
                />
            )}
            <ModalTwo open {...rest} onClose={onClose}>
                <ModalTwoHeader title={title} {...rest} />
                <ModalTwoContent>
                    {(() => {
                        if (loadingInit) {
                            return (
                                <div className="text-center">
                                    <CircleLoader />
                                </div>
                            );
                        }

                        if (!result?.memberKeyPayloads.length) {
                            return <div>{confirmText}</div>;
                        }

                        return (
                            <div>
                                <div className="mb-4">
                                    {confirmText} {c('passwordless').t`All administrators will get access to the key.`}
                                </div>

                                <AdministratorList members={result?.memberKeyPayloads} expandByDefault={false} />
                            </div>
                        );
                    })()}
                </ModalTwoContent>
                <ModalTwoFooter>
                    <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                    <Button
                        color="norm"
                        loading={loading}
                        disabled={loadingInit}
                        onClick={() => {
                            if (!result) {
                                return;
                            }
                            withLoading(handleSubmit(result)).catch(errorHandler);
                        }}
                    >
                        {c('Action').t`Confirm`}
                    </Button>
                </ModalTwoFooter>
            </ModalTwo>
        </>
    );
};

export default ChangeOrganizationKeysPasswordlessModal;

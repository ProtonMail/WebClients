import { useState } from 'react';

import { c } from 'ttag';

import { deleteAddressKeyAction } from '@proton/account/addressKeys/deleteAddressKeyAction';
import { Button } from '@proton/atoms/Button/Button';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import type { PromptProps } from '@proton/components/components/prompt/Prompt';
import Prompt from '@proton/components/components/prompt/Prompt';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import type { Address, AddressKey, DecryptedAddressKey } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import ExportPrivateKeyModal from '../exportKey/ExportPrivateKeyModal';

enum STEPS {
    EXPORT_KEY,
    DELETE_KEY,
}

interface Props extends Omit<PromptProps, 'title' | 'buttons' | 'children'> {
    fingerprint: string;
    privateKey?: DecryptedAddressKey;
    address: Address;
    addressKey: AddressKey;
    name: string;
}

const DeleteKeyModal = ({ name, address, addressKey, fingerprint, privateKey, ...rest }: Props) => {
    const [step, setStep] = useState(privateKey ? STEPS.EXPORT_KEY : STEPS.DELETE_KEY);
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const handleClose = loading ? noop : rest.onClose;
    const dispatch = useDispatch();
    const [exportModal, showExportModal] = useModalTwoPromise<{ privateKey: DecryptedAddressKey }>();
    const handleError = useErrorHandler();

    const deleteKey = async () => {
        try {
            await dispatch(deleteAddressKeyAction({ address, addressKeyID: addressKey.ID }));
            const fp = <code key="0">{fingerprint}</code>;
            createNotification({
                text: <span>{c('Notification').jt`Key with fingerprint ${fp} has been deleted.`}</span>,
            });
        } catch (e) {
            handleError(e);
        } finally {
            rest.onClose?.();
        }
    };

    const stepProps: {
        children: PromptProps['children'];
        buttons: PromptProps['buttons'];
        title: PromptProps['title'];
    } = (() => {
        if (step === STEPS.EXPORT_KEY) {
            return {
                title: c('Action').t`Export key before deleting`,
                children: (
                    <>
                        <div className="mb-4">{c('Info').t`Key deletion is irreversible!`}</div>
                        <div>
                            {c('Info')
                                .t`You should export a backup of this key in case you need to restore data it encrypted.`}
                        </div>
                    </>
                ),
                buttons: [
                    <Button
                        color="norm"
                        loading={loading}
                        onClick={async () => {
                            await withLoading(
                                (async () => {
                                    try {
                                        if (privateKey) {
                                            await showExportModal({ privateKey });
                                        }
                                        setStep(STEPS.DELETE_KEY);
                                    } catch {}
                                })()
                            );
                        }}
                    >
                        {c('Action').t`Export key`}
                    </Button>,
                    <Button onClick={() => setStep(STEPS.DELETE_KEY)} disabled={loading}>
                        {c('Action').t`Delete without exporting`}
                    </Button>,
                    <Button onClick={handleClose} disabled={loading}>{c('Action').t`Cancel`}</Button>,
                ],
            };
        }

        if (step === STEPS.DELETE_KEY) {
            return {
                title: c('Title').t`Delete key permanently?`,
                children: (
                    <>
                        <div className="mb-4">
                            {c('Info')
                                .t`You will NOT be able to decrypt any messages, files, and other data encrypted with this key. All data signed with this key will no longer be verified by ${BRAND_NAME} applications.`}
                        </div>
                        <div>
                            {c('Info')
                                .t`To avoid data loss, only delete it if you know what you’re doing or have exported a copy.`}
                        </div>
                    </>
                ),
                buttons: [
                    <Button
                        color="danger"
                        loading={loading}
                        onClick={async () => {
                            await withLoading(deleteKey());
                        }}
                    >
                        {c('Action').t`Delete permanently`}
                    </Button>,
                    <Button onClick={handleClose} disabled={loading}>{c('Action').t`Cancel`}</Button>,
                ],
            };
        }

        throw new Error('Unsupported step');
    })();

    return (
        <>
            {exportModal(({ onResolve, onReject, privateKey, ...rest }) => {
                return (
                    <ExportPrivateKeyModal
                        {...rest}
                        onClose={() => {
                            onReject();
                        }}
                        onSuccess={() => {
                            onResolve();
                        }}
                        name={name}
                        privateKey={privateKey.privateKey}
                    />
                );
            })}
            <Prompt {...rest} {...stepProps} />
        </>
    );
};

export default DeleteKeyModal;

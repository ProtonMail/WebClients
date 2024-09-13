import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Prompt from '@proton/components/components/prompt/Prompt';
import type { PromptProps } from '@proton/components/components/prompt/Prompt';
import { useLoading } from '@proton/hooks';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { useNotifications } from '../../../hooks';

enum STEPS {
    EXPORT_KEY,
    DELETE_KEY,
}

interface Props extends Omit<PromptProps, 'title' | 'buttons' | 'children'> {
    fingerprint: string;
    onDelete: () => Promise<void>;
    onExport?: () => Promise<void>;
}

const DeleteKeyModal = ({ onClose, fingerprint, onDelete, onExport, ...rest }: Props) => {
    const [step, setStep] = useState(onExport ? STEPS.EXPORT_KEY : STEPS.DELETE_KEY);
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const handleClose = loading ? noop : onClose;

    const deleteKey = async () => {
        try {
            await onDelete();
            const fp = <code key="0">{fingerprint}</code>;
            createNotification({
                text: <span>{c('Notification').jt`Key with fingerprint ${fp} has been deleted.`}</span>,
            });
        } finally {
            onClose?.();
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
                                    await onExport?.();
                                    await setStep(STEPS.DELETE_KEY);
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

    return <Prompt {...rest} {...stepProps} />;
};

export default DeleteKeyModal;

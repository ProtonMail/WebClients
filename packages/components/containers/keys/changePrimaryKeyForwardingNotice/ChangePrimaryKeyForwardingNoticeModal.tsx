import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { PromptProps } from '@proton/components/components/prompt/Prompt';
import Prompt from '@proton/components/components/prompt/Prompt';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import noop from '@proton/utils/noop';

import getPausedForwardingNotice from './getPausedForwardingNotice';

interface Props extends Omit<PromptProps, 'title' | 'buttons' | 'children'> {
    onMakeKeyPrimary: () => Promise<void>;
    fingerprint: string;
}

const ChangePrimaryKeyForwardingNotice = ({ onClose, onMakeKeyPrimary, fingerprint, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const handleClose = loading ? noop : onClose;

    const makeKeyPrimary = async () => {
        try {
            await onMakeKeyPrimary();
            const fp = <code key="0">{fingerprint}</code>;
            createNotification({
                text: <span>{c('Notification').jt`Key with fingerprint ${fp} is now primary.`}</span>,
            });
        } finally {
            onClose?.();
        }
    };

    const pausedForwardingNotice = getPausedForwardingNotice();

    return (
        <Prompt
            title={c('Title').t`Change primary key?`}
            children={
                <>
                    <div className="mb-4">{pausedForwardingNotice}</div>
                </>
            }
            buttons={[
                <Button
                    color="norm"
                    loading={loading}
                    onClick={async () => {
                        await withLoading(makeKeyPrimary());
                    }}
                >
                    {c('Action').t`Make key primary`}
                </Button>,
                <Button onClick={handleClose} disabled={loading}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        />
    );
};

export default ChangePrimaryKeyForwardingNotice;

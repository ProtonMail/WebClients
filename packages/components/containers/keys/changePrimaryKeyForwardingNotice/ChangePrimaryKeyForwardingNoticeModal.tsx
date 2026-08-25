import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { useLoading } from '@proton/hooks';
import noop from '@proton/utils/noop';

import type { PromptProps } from '../../../components/prompt/Prompt';
import Prompt from '../../../components/prompt/Prompt';
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

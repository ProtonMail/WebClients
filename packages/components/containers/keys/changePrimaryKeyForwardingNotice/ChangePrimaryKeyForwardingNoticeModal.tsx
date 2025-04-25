import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { PromptProps } from '@proton/components/components/prompt/Prompt';
import Prompt from '@proton/components/components/prompt/Prompt';
import { getMailRouteTitles } from '@proton/components/containers/account/constants/settingsRouteTitles';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import noop from '@proton/utils/noop';

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

    return (
        <Prompt
            title={c('Title').t`Change primary key?`}
            children={
                <>
                    <div className="mb-4">
                        {c('Info')
                            .t`Existing end-to-end encrypted forwardings towards other users will be paused. You can manually resume them under the '${getMailRouteTitles().autoReply}' settings.`}
                    </div>
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

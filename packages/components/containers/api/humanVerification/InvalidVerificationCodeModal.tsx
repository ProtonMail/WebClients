import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Prompt from '@proton/components/components/prompt/Prompt';
import { useLoading } from '@proton/hooks';
import noop from '@proton/utils/noop';

interface Props {
    edit?: string;
    request?: string;
    onEdit: () => void;
    onResend: () => Promise<void>;
    onClose: () => void;
    open: boolean;
}

const InvalidVerificationCodeModal = ({
    onEdit,
    onResend,
    onClose,
    open,
    edit = c('Action').t`Try another method`,
    request = c('Action').t`Request new code`,
}: Props) => {
    const [loading, withLoading] = useLoading();
    return (
        <Prompt
            open={open}
            title={c('Title').t`Invalid verification code`}
            onClose={onClose}
            buttons={[
                <Button
                    loading={loading}
                    color="norm"
                    onClick={() => {
                        withLoading(onResend()).then(onClose).catch(noop);
                    }}
                >
                    {request}
                </Button>,
                <Button
                    disabled={loading}
                    onClick={() => {
                        onClose();
                        onEdit();
                    }}
                >
                    {edit}
                </Button>,
            ]}
        >
            {c('Info').t`Would you like to receive a new verification code or use an alternative verification method?`}
        </Prompt>
    );
};

export default InvalidVerificationCodeModal;

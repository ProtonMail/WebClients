import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Prompt from '@proton/components/components/prompt/Prompt';
import type { PromptProps } from '@proton/components/components/prompt/Prompt';
import useLoading from '@proton/hooks/useLoading';
import noop from '@proton/utils/noop';

interface Props extends Omit<PromptProps, 'title' | 'buttons' | 'children'> {
    onConfirm: () => Promise<void>;
}

const RegenerateSCIMConfirmModal = ({ onConfirm, onClose, ...props }: Props) => {
    const [loading, withLoading] = useLoading();
    return (
        <Prompt
            onClose={onClose}
            {...props}
            title={c('scim: Title').t`Generate new SCIM token?`}
            buttons={[
                <Button
                    color="danger"
                    onClick={() => {
                        withLoading(onConfirm()).catch(noop);
                    }}
                    loading={loading}
                >
                    {c('scim: Action').t`Generate token`}
                </Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            <p>
                {c('scim: Info')
                    .t`The SCIM automatic provisioning will be disabled until you enter the new SCIM token into your identity provider’s settings.`}
            </p>
        </Prompt>
    );
};

export default RegenerateSCIMConfirmModal;

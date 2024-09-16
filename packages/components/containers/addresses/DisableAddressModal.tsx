import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Prompt from '@proton/components/components/prompt/Prompt';
import type { PromptProps } from '@proton/components/components/prompt/Prompt';
import { useLoading } from '@proton/hooks';
import { BRAND_NAME } from '@proton/shared/lib/constants';

interface Props extends Omit<PromptProps, 'title' | 'children' | 'buttons'> {
    email: string;
    onDisable: () => Promise<void>;
}

const DisableAddressModal = ({ email, onDisable, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();
    const address = (
        <strong key="address" className="text-break">
            {email}
        </strong>
    );
    return (
        <Prompt
            title={c('Disable address prompt').t`Disable address?`}
            buttons={[
                <Button color="danger" onClick={() => withLoading(onDisable().then(rest.onClose))} loading={loading}>
                    {c('Disable address prompt').t`Disable address`}
                </Button>,
                <Button onClick={rest.onClose} disabled={loading}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {c('Disable address prompt')
                .jt`By disabling this address ${address}, you will no longer be able to send or receive emails using this address and all the linked ${BRAND_NAME} products will be disabled.`}
            <br />
            <br />
            {c('Disable address prompt').t`Are you sure you want to disable this address?`}
        </Prompt>
    );
};

export default DisableAddressModal;

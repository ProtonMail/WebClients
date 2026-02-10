import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Prompt, { type PromptProps } from '@proton/components/components/prompt/Prompt';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';

import { grantDelegatedAccessThunk } from '../../../outgoingActions';
import type { EnrichedOutgoingDelegatedAccess } from '../../../shared/outgoing/interface';
import { useDispatch } from '../../../useDispatch';

interface Props extends Omit<PromptProps, 'children' | 'buttons'> {
    value: EnrichedOutgoingDelegatedAccess;
}

export const GrantOutgoingEmergencyContactModal = ({ value, ...rest }: Props) => {
    const handleError = useErrorHandler();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const user = (
        <span key="user" className="text-bold text-break">
            {value.parsedOutgoingDelegatedAccess.contact.formatted}
        </span>
    );

    return (
        <Prompt
            {...rest}
            title={c('emergency_access').t`Give immediate access?`}
            buttons={[
                <Button
                    color="norm"
                    loading={loading}
                    onClick={() => {
                        void withLoading(
                            (async function run() {
                                try {
                                    await dispatch(grantDelegatedAccessThunk(value.outgoingDelegatedAccess));
                                    createNotification({ text: c('emergency_access').t`Emergency access granted` });
                                    rest.onClose?.();
                                } catch (e) {
                                    handleError(e);
                                }
                            })()
                        );
                    }}
                >
                    {c('emergency_access').t`Give access now`}
                </Button>,
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            <p className="mt-0 mb-2">
                {c('emergency_access').jt`${user} will be able to use your account and change your data.`}
            </p>
            <p className="mt-0 mb-2">
                {c('emergency_access')
                    .t`You can remove their access at any time to regain exclusive control of your account.`}
            </p>
        </Prompt>
    );
};

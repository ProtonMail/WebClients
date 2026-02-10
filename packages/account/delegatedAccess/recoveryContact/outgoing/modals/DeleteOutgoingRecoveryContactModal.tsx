import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Prompt, { type PromptProps } from '@proton/components/components/prompt/Prompt';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';

import { DelegatedAccessTypeEnum } from '../../../interface';
import { deleteDelegatedAccessThunk } from '../../../outgoingActions';
import type { EnrichedOutgoingDelegatedAccess } from '../../../shared/outgoing/interface';
import { useDispatch } from '../../../useDispatch';

interface Props extends Omit<PromptProps, 'children' | 'buttons'> {
    value: EnrichedOutgoingDelegatedAccess;
}

export const DeleteOutgoingRecoveryContactModal = ({ value, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();
    const handleError = useErrorHandler();
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();

    const user = (
        <span key="user" className="text-bold text-break">
            {value.parsedOutgoingDelegatedAccess.contact.formatted}
        </span>
    );

    return (
        <Prompt
            {...rest}
            title={c('emergency_access').t`Remove recovery contact`}
            buttons={[
                <Button
                    color="danger"
                    loading={loading}
                    onClick={() => {
                        void withLoading(
                            (async function run() {
                                try {
                                    await dispatch(
                                        deleteDelegatedAccessThunk({
                                            id: value.outgoingDelegatedAccess.DelegatedAccessID,
                                            types: DelegatedAccessTypeEnum.SocialRecovery,
                                        })
                                    );
                                    createNotification({ text: c('emergency_access').t`Recovery contact removed` });
                                    rest.onClose?.();
                                } catch (e) {
                                    handleError(e);
                                }
                            })()
                        );
                    }}
                >
                    {c('Action').t`Remove`}
                </Button>,
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            {c('emergency_access').t`This will take effect immediately.`}
            <br />
            <br />
            {c('emergency_access')
                .jt`${user} will no longer be able to help you recover your data after a password reset.`}
        </Prompt>
    );
};

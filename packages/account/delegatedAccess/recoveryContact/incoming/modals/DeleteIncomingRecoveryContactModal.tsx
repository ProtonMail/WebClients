import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Prompt, { type PromptProps } from '@proton/components/components/prompt/Prompt';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';

import { deleteDelegatedAccessThunk } from '../../../incomingActions';
import { DelegatedAccessTypeEnum } from '../../../interface';
import type { EnrichedIncomingDelegatedAccess } from '../../../shared/incoming/interface';
import { useDispatch } from '../../../useDispatch';

interface Props extends Omit<PromptProps, 'children' | 'buttons'> {
    value: EnrichedIncomingDelegatedAccess;
}

export const DeleteIncomingRecoveryContactModal = ({ value, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const handleError = useErrorHandler();

    const user = (
        <span key="user" className="text-bold text-break">
            {value.parsedIncomingDelegatedAccess.contact.formatted}
        </span>
    );

    return (
        <Prompt
            {...rest}
            title={c('emergency_access').t`Stop being recovery contact?`}
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
                                            id: value.incomingDelegatedAccess.DelegatedAccessID,
                                            types: DelegatedAccessTypeEnum.SocialRecovery,
                                        })
                                    );
                                    const user = value.parsedIncomingDelegatedAccess.contact.formatted;
                                    createNotification({
                                        text: c('emergency_access').t`Recovery contact for ${user} removed`,
                                    });
                                    rest.onClose?.();
                                } catch (e) {
                                    handleError(e);
                                }
                            })()
                        );
                    }}
                >
                    {c('Action').t`Opt out`}
                </Button>,
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            {c('emergency_access').t`This will take effect immediately.`}
            <br />
            <br />
            {c('emergency_access')
                .jt`You will no longer be able to help ${user} recover their data after they reset their password.`}
        </Prompt>
    );
};

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Prompt, { type PromptProps } from '@proton/components/components/prompt/Prompt';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';

import { resetDelegatedAccessThunk } from '../../../incomingActions';
import type { EnrichedIncomingDelegatedAccess } from '../../../shared/incoming/interface';
import { useDispatch } from '../../../useDispatch';

interface Props extends Omit<PromptProps, 'children' | 'buttons'> {
    value: EnrichedIncomingDelegatedAccess;
}

export const CancelIncomingEmergencyContactModal = ({ value, ...rest }: Props) => {
    const handleError = useErrorHandler();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const user = (
        <span key="user" className="text-bold text-break">
            {value.parsedIncomingDelegatedAccess.contact.formatted}
        </span>
    );

    return (
        <Prompt
            {...rest}
            title={c('emergency_access').t`Cancel request?`}
            buttons={[
                <Button
                    color="danger"
                    loading={loading}
                    onClick={() => {
                        void withLoading(
                            (async function run() {
                                try {
                                    await dispatch(
                                        resetDelegatedAccessThunk({
                                            id: value.incomingDelegatedAccess.DelegatedAccessID,
                                        })
                                    );
                                    createNotification({ text: c('emergency_access').t`Access request canceled` });
                                    rest.onClose?.();
                                } catch (e) {
                                    handleError(e);
                                }
                            })()
                        );
                    }}
                >
                    {c('Action').t`Cancel request`}
                </Button>,
                <Button onClick={rest.onClose}>{c('Action').t`Close`}</Button>,
            ]}
        >
            {c('emergency_access')
                .jt`You will still be able to request access to the account of ${user} at a later time.`}
        </Prompt>
    );
};

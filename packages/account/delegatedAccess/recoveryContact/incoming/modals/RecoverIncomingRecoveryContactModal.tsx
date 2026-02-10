import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo, { type ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';

import { recoverThunk } from '../../../incomingActions';
import { ContactView } from '../../../shared/ContactView';
import type { EnrichedIncomingDelegatedAccess } from '../../../shared/incoming/interface';
import { useDispatch } from '../../../useDispatch';

interface RequestAccessEmergencyContactModalProps extends Omit<ModalProps, 'children' | 'buttons'> {
    value: EnrichedIncomingDelegatedAccess;
}

export const RecoverIncomingRecoveryContactModal = ({ value, ...rest }: RequestAccessEmergencyContactModalProps) => {
    const dispatch = useDispatch();
    const [loading, withLoading] = useLoading();
    const handleError = useErrorHandler();
    const { createNotification } = useNotifications();

    const user = value.parsedIncomingDelegatedAccess.contact.formatted;

    return (
        <ModalTwo {...rest} size="small">
            <ModalTwoHeader title={c('emergency_access').t`Review recovery request`} />
            <ModalTwoContent>
                <div className="border border-primary rounded-xl py-3 px-4 mb-4">
                    <ContactView
                        id={value.incomingDelegatedAccess.DelegatedAccessID}
                        {...value.parsedIncomingDelegatedAccess.contact}
                        createdAtDate={value.parsedIncomingDelegatedAccess.createdAtDate}
                    />
                </div>
                <p className="mt-0 mb-4 text-break">
                    {getBoldFormattedText(
                        c('emergency_access')
                            .t`We received a request to unlock the encrypted data of your contact **${user}**.`
                    )}
                </p>

                <p className="mt-0 mb-4">
                    {c('emergency_access').t`Connect with them to confirm they need help to recover their data.`}
                </p>

                <p className="mt-0 mb-4">
                    <ol className="my-0">
                        <li className="mb-2">{c('emergency_access')
                            .t`Connect with them to confirm they need help to recover their data.`}</li>
                        <li className="mb-2">
                            {getBoldFormattedText(
                                c('emergency_access')
                                    .t`**If they confirm**, click **Approve recovery**. This will unlock their encrypted data.`
                            )}
                        </li>
                    </ol>
                </p>

                <p className="mt-0 mb-4">
                    {getBoldFormattedText(
                        c('emergency_access')
                            .t`**If they didn’t request your help**, it is possible that someone else is trying to access their account. In that case, ignore this request.`
                    )}
                </p>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Ignore`}</Button>
                <Button
                    color="norm"
                    loading={loading}
                    type="button"
                    onClick={() => {
                        void withLoading(
                            (async function run() {
                                try {
                                    await dispatch(
                                        recoverThunk({ incomingDelegatedAccess: value.incomingDelegatedAccess })
                                    );
                                    createNotification({ text: c('emergency_access').t`Recovery approved` });
                                    rest.onClose?.();
                                } catch (e) {
                                    handleError(e);
                                }
                            })()
                        );
                    }}
                >{c('emergency_access').t`Approve recovery`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

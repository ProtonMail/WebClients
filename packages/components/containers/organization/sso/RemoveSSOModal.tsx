import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useApi, useEventManager, useNotifications } from '@proton/components';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useLoading from '@proton/hooks/useLoading';
import { removeSAMLConfig } from '@proton/shared/lib/api/samlSSO';
import type { SSO } from '@proton/shared/lib/interfaces';
import errorImg from '@proton/styles/assets/img/errors/error-generic-triangle.svg';

interface Props extends ModalProps {
    sso: SSO;
}

const RemoveSSOModal = ({ sso, onClose, ...rest }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();

    const removeSSO = async () => {
        await api(removeSAMLConfig(sso.ID));
        await call();

        createNotification({
            text:
                // translator: refers to removing the SSO configuration
                c('Info').t`Single sign-on removed`,
        });

        onClose?.();
    };

    const boldSSOUserInformation = (
        <b key="bold-sso-information">
            {
                // translator: full sentence 'SSO users (provided by your Identity Provider) will be deleted and you will have to create them manually to add them back to your organization.'
                c('Info').t`SSO users (provided by your Identity Provider) will be deleted`
            }
        </b>
    );

    return (
        <ModalTwo onClose={onClose} size="small" {...rest}>
            <ModalTwoHeader title={c('Title').t`Remove single sign-on for your organization?`} />
            <ModalTwoContent>
                <div className="text-center my-8">
                    <img className="m-auto w-custom" style={{ '--w-custom': '6rem' }} src={errorImg} alt="" />
                </div>
                <p className="m-0 text-bold">{c('Info')
                    .t`The credentials from your Identity Provider will be deleted.`}</p>
                <p className="my-4">{c('Info').t`Once single sign-on is disabled for your organization:`}</p>
                <ul className="mt-0">
                    <li>
                        {
                            // translator: full sentence 'SSO users (provided by your Identity Provider) will be deleted and you will have to create them manually to add them back to your organization.'
                            c('Info')
                                .jt`${boldSSOUserInformation} and you will have to create them manually to add them back to your organization`
                        }
                    </li>
                    <li>
                        {c('Info')
                            .t`Non-SSO users (created manually, not provided by your Identity Provider) can still log in to your organization`}
                    </li>
                </ul>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button color="danger" onClick={() => withLoading(removeSSO)} loading={loading}>
                    {c('Action').t`Remove single sign-on`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default RemoveSSOModal;

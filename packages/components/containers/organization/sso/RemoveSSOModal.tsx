import { c } from 'ttag';

import { useGetSamlSSO } from '@proton/account/samlSSO/hooks';
import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { SsoAppInfo } from '@proton/components/containers/organization/sso/ssoAppInfo';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { CacheType } from '@proton/redux-utilities';
import { removeSAMLConfig } from '@proton/shared/lib/api/samlSSO';
import type { SSO } from '@proton/shared/lib/interfaces';
import errorImg from '@proton/styles/assets/img/errors/error-generic-triangle.svg';

interface Props extends ModalProps {
    sso: SSO;
    ssoAppInfo: SsoAppInfo;
}

const RemoveSSOModal = ({ sso, ssoAppInfo, onClose, ...rest }: Props) => {
    const api = useApi();
    const getSamlSSO = useGetSamlSSO();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();

    const removeSSO = async () => {
        await api(removeSAMLConfig(sso.ID));
        await getSamlSSO({ cache: CacheType.None });

        createNotification({
            text:
                // translator: refers to removing the SSO configuration
                c('sso').t`Single sign-on removed`,
        });

        onClose?.();
    };

    return (
        <ModalTwo onClose={onClose} size="small" {...rest}>
            <ModalTwoHeader title={c('sso').t`Remove single sign-on for your organization?`} />
            <ModalTwoContent>
                <div className="text-center mb-6">
                    <img className="m-auto w-custom" style={{ '--w-custom': '6rem' }} src={errorImg} alt="" />
                </div>
                <div className="mb-2 text-bold">{c('sso').t`Your SSO configuration will be deleted.`}</div>
                <div className="mb-2">{c('sso').t`Once single sign-on is disabled for your organization:`}</div>
                <ul className="m-0">
                    <li className="mb-2">
                        {getBoldFormattedText(
                            ssoAppInfo.type === 'global-sso'
                                ? c('sso')
                                      .t`**SSO users will be detached from your identity provider** and converted to non-SSO users.`
                                : c('sso')
                                      .t`**SSO users (provided by your Identity Provider) will be deleted** and you will have to create them manually to add them back to your organization.`
                        )}
                    </li>
                    <li>
                        {ssoAppInfo.type === 'global-sso'
                            ? c('sso').t`You will have to create new users manually to add them to your organization.`
                            : c('sso')
                                  .t`Non-SSO users (created manually, not provided by your Identity Provider) can still log in to your organization.`}
                    </li>
                </ul>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button color="danger" onClick={() => withLoading(removeSSO)} loading={loading}>
                    {c('sso').t`Remove single sign-on`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default RemoveSSOModal;

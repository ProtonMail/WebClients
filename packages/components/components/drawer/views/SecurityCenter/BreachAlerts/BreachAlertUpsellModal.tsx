import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { Href } from '@proton/atoms/Href';
import { SettingsLink, useUpsellConfig } from '@proton/components/components';
import { ModalStateProps, ModalTwo } from '@proton/components/components';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import breachReportUpsellShieldImage from '@proton/styles/assets/img/illustrations/upsell-breach-alerts-shield.svg';

interface Props {
    modalProps: ModalStateProps;
}

const BreachAlertUpsellModal = ({ modalProps }: Props) => {
    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.BREACH_ALERTS,
    });
    const { upgradePath, onUpgrade } = useUpsellConfig(upsellRef);

    return (
        <ModalTwo size="small" {...modalProps}>
            <ModalHeader />
            <ModalContent>
                <div className="text-center">
                    <div className="mb-4 rounded">
                        <img src={breachReportUpsellShieldImage} alt="" />
                    </div>
                    <h1 className="h3 text-bold mb-4">{c('Title').t`Stay safer online`}</h1>
                    <p className="color-weak mt-0 mb-4 px-4">
                        {c('Description')
                            .t`Your personal data was leaked by an online service in a data breach. View full details and get recommended actions.`}
                    </p>
                    <p className="color-weak my-0 px-4 text-bold">
                        {c('Description')
                            .t`Breach alerts and reports are available with a paid plan. Upgrade for immediate access.`}
                    </p>
                    <ButtonLike
                        as={Href}
                        color="norm"
                        shape="underline"
                        fullWidth
                        // TODO: change when we have knowledge base url
                        href={getKnowledgeBaseUrl('/proton-sentinel')}
                    >
                        {c('Link').t`Learn more`}
                    </ButtonLike>
                </div>
            </ModalContent>
            <ModalFooter>
                <ButtonLike
                    as={upgradePath ? SettingsLink : undefined}
                    path={upgradePath}
                    onClick={() => {
                        onUpgrade?.();
                        modalProps.onClose();
                    }}
                    size="large"
                    color="norm"
                    shape="solid"
                    fullWidth
                >
                    {c('Action').t`Upgrade now`}
                </ButtonLike>
            </ModalFooter>
        </ModalTwo>
    );
};

export default BreachAlertUpsellModal;

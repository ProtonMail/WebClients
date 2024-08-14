import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { Href } from '@proton/atoms/Href';
import { SettingsLink } from '@proton/components/components';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useUser } from '@proton/components/hooks';
import {
    APP_UPSELL_REF_PATH,
    MAIL_UPSELL_PATHS,
    PROTON_SENTINEL_NAME,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath, getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import protonSentinelImage from '@proton/styles/assets/img/illustrations/upsell-proton-sentinel.svg';

import type { ModalStateProps } from '../../../../../modalTwo';
import { ModalTwo } from '../../../../../modalTwo';

interface Props {
    modalProps: ModalStateProps;
    upsellComponent?: UPSELL_COMPONENT;
}

const ProtonSentinelUpsellModal = ({ modalProps, upsellComponent }: Props) => {
    const [user] = useUser();

    return (
        <ModalTwo size="small" {...modalProps} data-testid="security-center:proton-sentinel:upsell-modal">
            <ModalHeader />
            <ModalContent>
                <div className="text-center">
                    <div className="mb-4 rounded">
                        <img src={protonSentinelImage} className="w-full block" alt="" />
                    </div>
                    <h1 className="h3 text-bold mb-4">{c('Title').t`Get advanced protection`}</h1>
                    <p className="color-weak mt-0 mb-4 px-4">
                        {c('Description')
                            .t`Upgrade your account to activate ${PROTON_SENTINEL_NAME}, our cutting-edge AI-driven security solution with dedicated 24/7 expert support.`}
                    </p>
                    <p className="color-weak my-0 px-4 text-bold">
                        {c('Description').t`Designed for users seeking heightened protection for their accounts.`}
                    </p>
                    <ButtonLike
                        as={Href}
                        color="norm"
                        shape="underline"
                        fullWidth
                        href={getKnowledgeBaseUrl('/proton-sentinel')}
                    >
                        {c('Link').t`Learn more`}
                    </ButtonLike>
                </div>
            </ModalContent>
            <ModalFooter>
                <ButtonLike
                    as={SettingsLink}
                    path={addUpsellPath(
                        getUpgradePath({ user }),
                        getUpsellRef({
                            app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
                            component: upsellComponent ?? UPSELL_COMPONENT.MODAL,
                            feature: MAIL_UPSELL_PATHS.PROTON_SENTINEL,
                        })
                    )}
                    onClick={() => {
                        modalProps.onClose();
                    }}
                    size="large"
                    color="norm"
                    shape="solid"
                    fullWidth
                >
                    {c('new_plans: Action').t`Upgrade now`}
                </ButtonLike>
            </ModalFooter>
        </ModalTwo>
    );
};

export default ProtonSentinelUpsellModal;

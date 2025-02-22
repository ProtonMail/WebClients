import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { type ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { APP_UPSELL_REF_PATH, BRAND_NAME, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import illustration from '@proton/styles/assets/img/illustrations/upsell-composer-assistant.svg';

import UpsellFeatureList from '../UpsellFeatureList';
import UpsellModal from '../UpsellModal';

interface Props {
    modalProps: ModalStateProps;
}

const ComposerAssistantB2CUpsellModal = ({ modalProps }: Props) => {
    const [user] = useUser();
    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.ASSISTANT_COMPOSER,
    });

    return (
        <UpsellModal
            illustration={illustration}
            title={user.isFree ? c('Title').t`Craft better emails` : c('Title').t`Your free trial has ended`}
            description={
                <>
                    {c('Description')
                        .t`For unlimited access to the writing assistant and more, upgrade to ${BRAND_NAME} Duo.`}
                    <div className="mt-6 text-left">
                        <UpsellFeatureList
                            hideInfo
                            features={[
                                'proton-scribe',
                                '2-users-support',
                                '1-tb-secure-storage',
                                'all-proton-products',
                            ]}
                        />
                    </div>
                </>
            }
            modalProps={modalProps}
            sourceEvent="BUTTON_SCRIBE"
            upsellRef={upsellRef}
        />
    );
};

export default ComposerAssistantB2CUpsellModal;

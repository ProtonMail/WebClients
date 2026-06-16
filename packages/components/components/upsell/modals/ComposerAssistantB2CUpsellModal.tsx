import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import {
    APP_UPSELL_REF_PATH,
    BRAND_NAME,
    LUMO_SHORT_APP_NAME,
    MAIL_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import scribeIllustration from '@proton/styles/assets/img/illustrations/upsell-composer-assistant.svg';
import lumoIllustration from '@proton/styles/assets/img/lumo/lumo-upsell-modal-header.svg';
import { useFlag } from '@proton/unleash/useFlag';

import UpsellFeatureList from '../UpsellFeatureList';
import UpsellModal from '../UpsellModal/UpsellModal';

interface Props {
    modalProps: ModalStateProps;
}

const ComposerAssistantB2CUpsellModal = ({ modalProps }: Props) => {
    const [user] = useUser();
    const scribeToLumo = useFlag('ScribeToLumo');
    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.ASSISTANT_COMPOSER,
    });

    const title = (() => {
        if (!user.isFree) {
            return c('Title').t`Your free trial has ended`;
        }
        return scribeToLumo
            ? c('Title').t`Craft better emails with ${LUMO_SHORT_APP_NAME}`
            : c('Title').t`Craft better emails`;
    })();

    return (
        <UpsellModal
            illustration={scribeToLumo ? lumoIllustration : scribeIllustration}
            title={title}
            description={
                <>
                    {scribeToLumo
                        ? c('Description')
                              .t`For unlimited access to the writing assistant and more, upgrade to ${LUMO_SHORT_APP_NAME}.`
                        : c('Description')
                              .t`For unlimited access to the writing assistant and more, upgrade to ${BRAND_NAME} Duo.`}
                    <div className="mt-6 text-left">
                        <UpsellFeatureList
                            hideInfo
                            features={
                                scribeToLumo
                                    ? [
                                          'generate-emails-with-prompt',
                                          'quickly-craft-replies',
                                          'proofread-an-refine',
                                          'save-time-emailing',
                                      ]
                                    : ['proton-scribe', '2-users-support', '1-tb-secure-storage', 'all-proton-products']
                            }
                        />
                    </div>
                </>
            }
            modalProps={modalProps}
            upsellRef={upsellRef}
        />
    );
};

export default ComposerAssistantB2CUpsellModal;

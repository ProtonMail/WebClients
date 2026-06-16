import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import {
    APP_UPSELL_REF_PATH,
    LUMO_SHORT_APP_NAME,
    MAIL_APP_NAME,
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
    isOrgUser?: boolean;
}
const ComposerAssistantB2BUpsellModal = ({ modalProps, isOrgUser }: Props) => {
    const scribeToLumo = useFlag('ScribeToLumo');
    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.ASSISTANT_COMPOSER,
    });

    const description = (() => {
        if (scribeToLumo) {
            return isOrgUser
                ? c('Description')
                      .t`To continue to use ${LUMO_SHORT_APP_NAME} in ${MAIL_APP_NAME}, request access from your admin.`
                : c('Description')
                      .t`To continue to use ${LUMO_SHORT_APP_NAME} in ${MAIL_APP_NAME}, add it to your subscription.`;
        }
        return isOrgUser
            ? c('Description').t`To continue to use the writing assistant, request access from your admin.`
            : c('Description').t`To continue to use the writing assistant, add it to your subscription.`;
    })();

    return (
        <UpsellModal
            title={c('Title').t`Your free trial has ended`}
            description={
                <>
                    {description}
                    <div className="mt-6 text-left">
                        <UpsellFeatureList
                            hideInfo
                            features={[
                                'generate-emails-with-prompt',
                                'quickly-craft-replies',
                                'proofread-an-refine',
                                'save-time-emailing',
                            ]}
                        />
                    </div>
                </>
            }
            illustration={scribeToLumo ? lumoIllustration : scribeIllustration}
            modalProps={modalProps}
            upsellRef={upsellRef}
        />
    );
};

export default ComposerAssistantB2BUpsellModal;

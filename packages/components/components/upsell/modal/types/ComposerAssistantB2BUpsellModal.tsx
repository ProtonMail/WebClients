import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import illustration from '@proton/styles/assets/img/illustrations/upsell-composer-assistant.svg';

import UpsellFeatureList from '../UpsellFeatureList';
import UpsellModal from '../UpsellModal';

interface Props {
    modalProps: ModalStateProps;
    isOrgUser?: boolean;
}
const ComposerAssistantB2BUpsellModal = ({ modalProps, isOrgUser }: Props) => {
    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.ASSISTANT_COMPOSER,
    });

    return (
        <UpsellModal
            title={c('Title').t`Your free trial has ended`}
            description={
                <>
                    {isOrgUser
                        ? c('Description').t`To continue to use the writing assistant, request access from your admin.`
                        : c('Description').t`To continue to use the writing assistant, add it to your subscription.`}
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
            illustration={illustration}
            modalProps={modalProps}
            sourceEvent="BUTTON_SCRIBE"
            upsellRef={upsellRef}
        />
    );
};

export default ComposerAssistantB2BUpsellModal;

import { c } from 'ttag';

import { SUBSCRIPTION_STEPS } from '@proton/components/containers';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';

import { useUpsellConfig } from '../..';
import type { ModalStateProps } from '../../../modalTwo';
import { UpsellModal } from '../index';

interface Props {
    modalProps: ModalStateProps;
    upsellComponent?: UPSELL_COMPONENT;
}

const AutoDeleteUpsellModal = ({ modalProps, upsellComponent }: Props) => {
    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: upsellComponent ?? UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.AUTO_DELETE,
    });
    const upsellConfig = useUpsellConfig({ upsellRef, step: SUBSCRIPTION_STEPS.PLAN_SELECTION });

    return (
        <UpsellModal
            data-testid="auto-delete:banner:upsell-modal"
            modalProps={modalProps}
            features={[
                'auto-delete-trash-and-spam',
                'schedule-messages',
                'unlimited-folders-and-labels',
                'search-message-content',
                'more-storage',
                'more-email-addresses',
                'custom-email-domains',
                'email-aliases',
            ]}
            description={c('Description')
                .t`Automatically clear out messages older than 30 days from trash and spam. Enjoy this and other benefits when you upgrade.`}
            title={c('Title').t`Clear out the junk`}
            {...upsellConfig}
        />
    );
};

export default AutoDeleteUpsellModal;

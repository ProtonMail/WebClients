import { c } from 'ttag';

import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';

import { ModalStateProps } from '../../../modalTwo';
import { UpsellModal } from '../index';

interface Props {
    modalProps: ModalStateProps;
}

const AutoDeleteUpsellModal = ({ modalProps }: Props) => (
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
        upsellRef={getUpsellRef({
            app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
            component: UPSELL_COMPONENT.MODAL,
            feature: MAIL_UPSELL_PATHS.AUTO_DELETE,
        })}
    />
);

export default AutoDeleteUpsellModal;

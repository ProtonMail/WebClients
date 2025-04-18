import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import UpsellModal from '@proton/components/components/upsell/UpsellModal/UpsellModal';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import autoDeleteImg from '@proton/styles/assets/img/illustrations/new-upsells-img/auto-delete.svg';

interface Props {
    modalProps: ModalStateProps;
    upsellComponent?: UPSELL_COMPONENT;
}

const AutoDeleteUpsellModal = ({ modalProps, upsellComponent }: Props) => (
    <UpsellModal
        data-testid="auto-delete:banner:upsell-modal"
        title={c('Title').t`No need to empty the trash`}
        description={c('Description').t`Automatically clear out emails moved to Trash and Spam more than 30 days ago.`}
        modalProps={modalProps}
        illustration={autoDeleteImg}
        upsellRef={getUpsellRef({
            app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
            component: upsellComponent ?? UPSELL_COMPONENT.MODAL,
            feature: MAIL_UPSELL_PATHS.AUTO_DELETE,
        })}
    />
);

export default AutoDeleteUpsellModal;

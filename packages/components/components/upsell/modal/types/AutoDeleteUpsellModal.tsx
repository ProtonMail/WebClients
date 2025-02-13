import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import NewUpsellModal from '@proton/components/components/upsell/modal/NewUpsellModal';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import autoDeleteImg from '@proton/styles/assets/img/illustrations/new-upsells-img/auto-delete.svg';

import { useMailUpsellConfig } from '../../useMailUpsellConfig';

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

    const { upsellConfig } = useMailUpsellConfig({ upsellRef });

    return (
        <NewUpsellModal
            data-testid="auto-delete:banner:upsell-modal"
            titleModal={c('Title').t`No need to empty the trash`}
            description={c('Description')
                .t`Automatically clear out emails moved to Trash and Spam more than 30 days ago.`}
            modalProps={modalProps}
            illustration={autoDeleteImg}
            sourceEvent="BUTTON_AUTO_DELETE"
            {...upsellConfig}
        />
    );
};

export default AutoDeleteUpsellModal;

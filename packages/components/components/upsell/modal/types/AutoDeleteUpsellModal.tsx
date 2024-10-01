import { c } from 'ttag';

import { NewUpsellModal } from '@proton/components';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import UpsellModal from '@proton/components/components/upsell/modal/UpsellModal';
import useUpsellConfig from '@proton/components/components/upsell/useUpsellConfig';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef, useNewUpsellModalVariant } from '@proton/shared/lib/helpers/upsell';
import autoDeleteImg from '@proton/styles/assets/img/illustrations/new-upsells-img/auto-delete.svg';

import useOneDollarConfig from '../../useOneDollarPromo';

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
    const oneDollarConfig = useOneDollarConfig();
    const upsellConfig = useUpsellConfig({ upsellRef, ...oneDollarConfig });

    const displayNewUpsellModalsVariant = useNewUpsellModalVariant();

    if (displayNewUpsellModalsVariant) {
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
    }

    return (
        <UpsellModal
            data-testid="auto-delete:banner:upsell-modal"
            modalProps={modalProps}
            features={[
                'auto-delete-trash-and-spam',
                'more-storage',
                'more-email-addresses',
                'unlimited-folders-and-labels',
                'custom-email-domains',
            ]}
            description={c('Description')
                .t`Auto-delete spam and trashed messages and unlock more premium features when you upgrade.`}
            title={c('Title').t`Clear out the junk`}
            sourceEvent="BUTTON_AUTO_DELETE"
            {...upsellConfig}
        />
    );
};

export default AutoDeleteUpsellModal;

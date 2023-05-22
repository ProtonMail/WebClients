import { c } from 'ttag';

import { ModalStateProps, UpsellModal } from '@proton/components/components';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';

interface Props {
    modalProps: ModalStateProps;
}
const FiltersUpsellModal = ({ modalProps }: Props) => {
    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.SHORT_ADDRESS,
        isSettings: true,
    });

    return (
        <UpsellModal
            title={c('Title').t`Activate @pm.me`}
            description={c('Description').t`Unlock shorter email addresses and other premium features by upgrading.`}
            modalProps={modalProps}
            upsellRef={upsellRef}
            features={['more-storage', 'more-email-addresses', 'unlimited-folders-and-labels', 'custom-email-domains']}
        />
    );
};

export default FiltersUpsellModal;

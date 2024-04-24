import { c } from 'ttag';

import { ModalStateProps, UpsellModal, useUpsellConfig } from '@proton/components/components';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';

interface Props {
    modalProps: ModalStateProps;
    feature: MAIL_UPSELL_PATHS.UNLIMITED_FOLDERS | MAIL_UPSELL_PATHS.UNLIMITED_LABELS;
    /**
     * Needed in a "Dropdown" scenario because we want to close the dropdown after closing the upsell modal
     */
    onCloseCustomAction?: () => void;
    isSettings?: boolean;
}
const LabelsUpsellModal = ({ modalProps, onCloseCustomAction, feature, isSettings = false }: Props) => {
    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature,
        isSettings,
    });

    const upsellConfig = useUpsellConfig({ upsellRef });

    return (
        <UpsellModal
            title={c('Title').t`Keep your inbox organized`}
            description={c('Description')
                .t`Unlock unlimited folders, labels and more premium features when you upgrade.`}
            modalProps={modalProps}
            features={['more-storage', 'more-email-addresses', 'unlimited-folders-and-labels', 'custom-email-domains']}
            onClose={onCloseCustomAction}
            {...upsellConfig}
        />
    );
};

export default LabelsUpsellModal;

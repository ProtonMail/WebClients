import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import UpsellModal from '@proton/components/components/upsell/modal/UpsellModal';
import useUpsellConfig from '@proton/components/components/upsell/useUpsellConfig';
import type { MAIL_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { APP_UPSELL_REF_PATH, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';

import useOneDollarConfig from '../../useOneDollarPromo';

interface Props {
    modalProps: ModalStateProps;
    feature: MAIL_UPSELL_PATHS.UNLIMITED_FOLDERS | MAIL_UPSELL_PATHS.UNLIMITED_LABELS;
    /**
     * Needed in a "Dropdown" scenario because we want to close the dropdown after closing the upsell modal
     */
    onCloseCustomAction?: () => void;
    upsellComponent?: UPSELL_COMPONENT;
    isSettings?: boolean;
}
const LabelsUpsellModal = ({
    modalProps,
    onCloseCustomAction,
    feature,
    upsellComponent,
    isSettings = false,
}: Props) => {
    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: upsellComponent ?? UPSELL_COMPONENT.MODAL,
        feature,
        isSettings,
    });
    const oneDollarConfig = useOneDollarConfig();
    const upsellConfig = useUpsellConfig({ upsellRef, ...oneDollarConfig });

    return (
        <UpsellModal
            title={c('Title').t`Keep your inbox organized`}
            description={c('Description')
                .t`Unlock unlimited folders, labels and more premium features when you upgrade.`}
            modalProps={modalProps}
            features={['unlimited-folders-and-labels', 'more-storage', 'more-email-addresses', 'custom-email-domains']}
            onClose={onCloseCustomAction}
            {...upsellConfig}
        />
    );
};

export default LabelsUpsellModal;

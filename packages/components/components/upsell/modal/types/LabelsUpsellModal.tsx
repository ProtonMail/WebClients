import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import UpsellModal from '@proton/components/components/upsell/modal/UpsellModal';
import useUpsellConfig from '@proton/components/components/upsell/useUpsellConfig';
import type { MAIL_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { APP_UPSELL_REF_PATH, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef, useNewUpsellModalVariant } from '@proton/shared/lib/helpers/upsell';
import labelsImg from '@proton/styles/assets/img/illustrations/new-upsells-img/labels.svg';

import useOneDollarConfig from '../../useOneDollarPromo';
import NewUpsellModal from '../NewUpsellModal';

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

    const displayNewUpsellModalsVariant = useNewUpsellModalVariant();

    if (displayNewUpsellModalsVariant) {
        return (
            <NewUpsellModal
                titleModal={c('Title').t`Need more labels or folders?`}
                description={c('Description').t`Create as many labels or folders as you need to keep your inbox tidy.`}
                modalProps={modalProps}
                illustration={labelsImg}
                sourceEvent="BUTTON_MORE_LABELS_FOLDERS"
                {...upsellConfig}
            />
        );
    }

    return (
        <UpsellModal
            title={c('Title').t`Keep your inbox organized`}
            description={c('Description')
                .t`Unlock unlimited folders, labels and more premium features when you upgrade.`}
            modalProps={modalProps}
            features={['unlimited-folders-and-labels', 'more-storage', 'more-email-addresses', 'custom-email-domains']}
            onClose={onCloseCustomAction}
            sourceEvent="BUTTON_MORE_LABELS_FOLDERS"
            {...upsellConfig}
        />
    );
};

export default LabelsUpsellModal;

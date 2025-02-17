import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { useMailUpsellConfig } from '@proton/components/components/upsell/useMailUpsellConfig';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import filterImg from '@proton/styles/assets/img/illustrations/new-upsells-img/arrows-to-folder-trash.svg';

import UpsellModal from '../UpsellModal';

interface Props {
    modalProps: ModalStateProps;
    /**
     * Needed in a "Dropdown" scenario because we want to close the dropdown after closing the upsell modal
     */
    onCloseCustomAction?: () => void;
    isSettings?: boolean;
}

const FiltersUpsellModal = ({ modalProps, onCloseCustomAction, isSettings = false }: Props) => {
    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.UNLIMITED_FILTERS,
        isSettings,
    });

    const upsellConfig = useMailUpsellConfig({ upsellRef });

    return (
        <UpsellModal
            titleModal={c('Title').t`Filter for more focus`}
            description={c('Description').t`Automatically sort your incoming messages before they reach your inbox.`}
            modalProps={modalProps}
            illustration={filterImg}
            onClose={onCloseCustomAction}
            sourceEvent="BUTTON_CUSTOM_FILTERS"
            {...upsellConfig}
        />
    );
};

export default FiltersUpsellModal;

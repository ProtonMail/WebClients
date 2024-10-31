import { c } from 'ttag';

import { useUpsellConfig } from '@proton/components';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import useOneDollarConfig from '@proton/components/components/upsell/useOneDollarPromo';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import zoomUpsellSvg from '@proton/styles/assets/img/illustrations/upsell-zoom-header.svg';

import NewUpsellModal from '../NewUpsellModal';

interface Props {
    modalProps: ModalStateProps;
}

const ZoomUpsellModal = ({ modalProps }: Props) => {
    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.CALENDAR_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.ZOOM_MEETING,
    });
    const oneDollarConfig = useOneDollarConfig();
    const upsellConfig = useUpsellConfig({ upsellRef, ...oneDollarConfig });

    return (
        <NewUpsellModal
            titleModal={c('Title').t`Get Zooming faster`}
            description={c('Description')
                .t`Create a Zoom meeting and add joining details to your event with one click.`}
            modalProps={modalProps}
            illustration={zoomUpsellSvg}
            submitText={c('Action').t`Upgrade to Mail Plus`}
            sourceEvent="BUTTON_ZOOM"
            {...upsellConfig}
        />
    );
};

export default ZoomUpsellModal;

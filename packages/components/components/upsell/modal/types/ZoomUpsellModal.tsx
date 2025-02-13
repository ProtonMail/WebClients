import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import {
    APP_UPSELL_REF_PATH,
    MAIL_SHORT_APP_NAME,
    MAIL_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getIsIframe } from '@proton/shared/lib/helpers/browser';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import zoomUpsellSvg from '@proton/styles/assets/img/illustrations/upsell-zoom-header.svg';

import { useMailUpsellConfig } from '../../useMailUpsellConfig';
import UpsellModal from '../UpsellModal';

interface Props {
    modalProps: ModalStateProps;
}

const upsellRef = getUpsellRef({
    app: APP_UPSELL_REF_PATH.CALENDAR_UPSELL_REF_PATH,
    component: UPSELL_COMPONENT.MODAL,
    feature: MAIL_UPSELL_PATHS.ZOOM_MEETING,
});

const ZoomUpsellModal = ({ modalProps }: Props) => {
    const isIframe = getIsIframe();
    const { upsellConfig } = useMailUpsellConfig({ upsellRef, preventInApp: isIframe });

    return (
        <UpsellModal
            titleModal={c('Title').t`Schedule meetings in one click`}
            description={c('Description')
                .t`Create a Zoom meeting and add joining details to your event with one click.`}
            modalProps={modalProps}
            illustration={zoomUpsellSvg}
            submitText={c('Action').t`Upgrade to ${MAIL_SHORT_APP_NAME} Plus`}
            sourceEvent="BUTTON_ZOOM"
            {...upsellConfig}
        />
    );
};

export default ZoomUpsellModal;

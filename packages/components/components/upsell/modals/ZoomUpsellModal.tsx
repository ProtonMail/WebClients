import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getIsIframe } from '@proton/shared/lib/helpers/browser';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import zoomUpsellSvg from '@proton/styles/assets/img/illustrations/upsell-zoom-header.svg';

import UpsellModal from '../UpsellModal/UpsellModal';

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

    return (
        <UpsellModal
            title={c('Title').t`Schedule meetings in one click`}
            description={c('Description')
                .t`Create a Zoom meeting and add joining details to your event with one click.`}
            modalProps={modalProps}
            illustration={zoomUpsellSvg}
            upsellRef={upsellRef}
            preventInAppPayment={isIframe}
        />
    );
};

export default ZoomUpsellModal;

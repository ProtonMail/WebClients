import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import UpsellModal from '@proton/components/components/upsell/UpsellModal/UpsellModal';
import { APP_UPSELL_REF_PATH, CALENDAR_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import bookingImg from '@proton/styles/assets/img/illustrations/new-upsells-img/booking_page.svg';

const upsellRef = getUpsellRef({
    app: APP_UPSELL_REF_PATH.CALENDAR_UPSELL_REF_PATH,
    component: UPSELL_COMPONENT.MODAL,
    feature: CALENDAR_UPSELL_PATHS.BOOKING_PAGE,
});

export const UpsellBookings = ({ ...modalProps }: ModalStateProps) => {
    return (
        <UpsellModal
            title={c('Title').t`Ready to automate your scheduling?`}
            description={c('Info')
                .t`Let others book time with you automatically. No back-and-forth emails. Share a link, and stay in control of your availability.`}
            modalProps={modalProps}
            illustration={bookingImg}
            upsellRef={upsellRef}
        />
    );
};

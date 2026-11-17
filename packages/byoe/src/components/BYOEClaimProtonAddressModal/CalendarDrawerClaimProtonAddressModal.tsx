import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { APPS, BRAND_NAME, CALENDAR_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { BYOE_CLAIM_PROTON_ADDRESS_SOURCE } from '../../constants';
import BYOEClaimProtonAddressModal from './BYOEClaimProtonAddressModal';

const CalendarDrawerClaimProtonAddressModal = (props: ModalStateProps) => (
    <BYOEClaimProtonAddressModal
        toApp={APPS.PROTONMAIL}
        title={c('Title').t`Get full access to ${CALENDAR_APP_NAME}`}
        description={c('Info')
            .t`${CALENDAR_APP_NAME} requires a ${BRAND_NAME} address for secure event sync and encryption. Claim your free ${MAIL_APP_NAME} address now.`}
        source={BYOE_CLAIM_PROTON_ADDRESS_SOURCE.CALENDAR_DRAWER}
        {...props}
    />
);

export default CalendarDrawerClaimProtonAddressModal;

import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components';
import { UpsellModal } from '@proton/components';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import snoozeImg from '@proton/styles/assets/img/illustrations/new-upsells-img/alarm-clock.svg';

const upsellRef = getUpsellRef({
    app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
    component: UPSELL_COMPONENT.MODAL,
    feature: MAIL_UPSELL_PATHS.SNOOZE_MESSAGE,
});

const SnoozeDurationSelection = (props: ModalStateProps) => {
    return (
        <UpsellModal
            data-testid="composer:snooze-message:upsell-modal"
            title={c('Title').t`Bad time for this email?`}
            description={c('Description')
                .t`With custom snooze, you can hide emails and set them to reappear at a better time.`}
            modalProps={props}
            illustration={snoozeImg}
            sourceEvent="BUTTON_SNOOZE"
            upsellRef={upsellRef}
        />
    );
};

export default SnoozeDurationSelection;

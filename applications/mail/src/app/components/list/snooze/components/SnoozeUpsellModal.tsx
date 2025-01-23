import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components';
import { NewUpsellModal, UpsellModal, useMailUpsellConfig } from '@proton/components';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import snoozeImg from '@proton/styles/assets/img/illustrations/new-upsells-img/alarm-clock.svg';

const upsellRef = getUpsellRef({
    app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
    component: UPSELL_COMPONENT.MODAL,
    feature: MAIL_UPSELL_PATHS.SNOOZE_MESSAGE,
});

const SnoozeDurationSelection = (props: ModalStateProps) => {
    const { upsellConfig, displayNewUpsellModalsVariant } = useMailUpsellConfig({ upsellRef });

    if (displayNewUpsellModalsVariant) {
        return (
            <NewUpsellModal
                data-testid="composer:snooze-message:upsell-modal"
                titleModal={c('Title').t`Bad time for this email?`}
                description={c('Description')
                    .t`With custom snooze, you can hide emails and set them to reappear at a better time.`}
                modalProps={props}
                illustration={snoozeImg}
                sourceEvent="BUTTON_SNOOZE"
                {...upsellConfig}
            />
        );
    }

    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div onClick={(e) => e.stopPropagation()}>
            <UpsellModal
                data-testid="composer:snooze-message:upsell-modal"
                title={c('Title').t`Want to snooze any time?`}
                description={c('Description').t`Unlock custom snooze times and more premium features when you upgrade.`}
                modalProps={props}
                sourceEvent="BUTTON_SNOOZE"
                features={[
                    'snooze-messages',
                    'more-storage',
                    'more-email-addresses',
                    'unlimited-folders-and-labels',
                    'custom-email-domains',
                ]}
                {...upsellConfig}
            />
        </div>
    );
};

export default SnoozeDurationSelection;

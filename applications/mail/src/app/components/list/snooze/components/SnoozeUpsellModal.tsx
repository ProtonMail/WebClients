import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components';
import { UpsellModal, useUpsellConfig } from '@proton/components';
import useOneDollarConfig from '@proton/components/components/upsell/useOneDollarPromo';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';

const SnoozeDurationSelection = (props: ModalStateProps) => {
    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.SNOOZE_MESSAGE,
    });
    const oneDollarConfig = useOneDollarConfig();
    const upsellConfig = useUpsellConfig({ upsellRef, ...oneDollarConfig });

    return (
        <div onClick={(e) => e.stopPropagation()}>
            <UpsellModal
                data-testid="composer:snooze-message:upsell-modal"
                title={c('Title').t`Want to snooze any time?`}
                description={c('Description').t`Unlock custom snooze times and more premium features when you upgrade.`}
                modalProps={props}
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

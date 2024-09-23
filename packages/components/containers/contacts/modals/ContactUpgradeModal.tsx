import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import UpsellModal from '@proton/components/components/upsell/modal/UpsellModal';
import useOneDollarConfig from '@proton/components/components/upsell/useOneDollarPromo';
import useUpsellConfig from '@proton/components/components/upsell/useUpsellConfig';
import { useConfig } from '@proton/components/hooks';
import { SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';

const ContactUpgradeModal = (modalProps: ModalStateProps) => {
    const { APP_NAME } = useConfig();

    const upsellRef =
        getUpsellRefFromApp({
            app: APP_NAME,
            feature: SHARED_UPSELL_PATHS.CONTACT_GROUP,
            component: UPSELL_COMPONENT.MODAL,
        }) || '';

    const oneDollarConfig = useOneDollarConfig();
    const upsellConfig = useUpsellConfig({ upsellRef, ...oneDollarConfig });
    return (
        <UpsellModal
            modalProps={modalProps}
            features={['more-storage', 'more-email-addresses', 'unlimited-folders-and-labels', 'custom-email-domains']}
            description={c('Description')
                .t`Save time by sending emails to everyone at once with contact groups. Unlock this and other premium features when you upgrade.`}
            title={c('Title').t`Unlock contacts groups`}
            {...upsellConfig}
        />
    );
};

export default ContactUpgradeModal;

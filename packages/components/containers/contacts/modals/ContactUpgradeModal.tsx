import { c } from 'ttag';

import { useConfig } from '@proton/components/hooks';
import { SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';

import { ModalStateProps, UpsellModal } from '../../../components';

const ContactUpgradeModal = (modalProps: ModalStateProps) => {
    const { APP_NAME } = useConfig();

    const upsellRef =
        getUpsellRefFromApp({
            app: APP_NAME,
            feature: SHARED_UPSELL_PATHS.CONTACT_GROUP,
            component: UPSELL_COMPONENT.MODAL,
        }) || '';

    return (
        <UpsellModal
            modalProps={modalProps}
            features={['more-storage', 'more-email-addresses', 'unlimited-folders-and-labels', 'custom-email-domains']}
            description={c('Description')
                .t`Save time by sending emails or invitations to everyone at once, a premium feature amongst many others. Upgrade today.`}
            title={c('Title').t`Unlock contacts groups`}
            upsellRef={upsellRef}
        />
    );
};

export default ContactUpgradeModal;

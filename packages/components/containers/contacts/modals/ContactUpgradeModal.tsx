import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import NewUpsellModal from '@proton/components/components/upsell/modal/NewUpsellModal';
import UpsellModal from '@proton/components/components/upsell/modal/UpsellModal';
import { useMailUpsellConfig } from '@proton/components/components/upsell/useMailUpsellConfig';
import useConfig from '@proton/components/hooks/useConfig';
import { SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import contactGroupsImg from '@proton/styles/assets/img/illustrations/new-upsells-img/book-contact-groups.svg';

const ContactUpgradeModal = (modalProps: ModalStateProps) => {
    const { APP_NAME } = useConfig();

    const upsellRef =
        getUpsellRefFromApp({
            app: APP_NAME,
            feature: SHARED_UPSELL_PATHS.CONTACT_GROUP,
            component: UPSELL_COMPONENT.MODAL,
        }) || '';

    const { upsellConfig, displayNewUpsellModalsVariant } = useMailUpsellConfig({ upsellRef });

    if (displayNewUpsellModalsVariant) {
        return (
            <NewUpsellModal
                titleModal={c('Title').t`One email, many recipients`}
                description={c('Description')
                    .t`With contact groups, you can send emails to everyone in the group with one click.`}
                modalProps={modalProps}
                illustration={contactGroupsImg}
                sourceEvent="BUTTON_CONTACT_GROUPS"
                {...upsellConfig}
            />
        );
    }

    return (
        <UpsellModal
            modalProps={modalProps}
            features={['more-storage', 'more-email-addresses', 'unlimited-folders-and-labels', 'custom-email-domains']}
            description={c('Description')
                .t`Save time by sending emails to everyone at once with contact groups. Unlock this and other premium features when you upgrade.`}
            title={c('Title').t`Unlock contacts groups`}
            sourceEvent="BUTTON_CONTACT_GROUPS"
            {...upsellConfig}
        />
    );
};

export default ContactUpgradeModal;

import { c } from 'ttag';

import { NewUpsellModal } from '@proton/components';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import UpsellModal from '@proton/components/components/upsell/modal/UpsellModal';
import useOneDollarConfig from '@proton/components/components/upsell/useOneDollarPromo';
import useUpsellConfig from '@proton/components/components/upsell/useUpsellConfig';
import { useConfig } from '@proton/components/hooks';
import { SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRefFromApp, useNewUpsellModalVariant } from '@proton/shared/lib/helpers/upsell';
import contactGroupsImg from '@proton/styles/assets/img/illustrations/new-upsells-img/book-contact-groups.svg';

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

    const displayNewUpsellModalsVariant = useNewUpsellModalVariant();

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

import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import UpsellModal from '@proton/components/components/upsell/UpsellModal';
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

    return (
        <UpsellModal
            title={c('Title').t`One email, many recipients`}
            description={c('Description')
                .t`With contact groups, you can send emails to everyone in the group with one click.`}
            modalProps={modalProps}
            illustration={contactGroupsImg}
            upsellRef={upsellRef}
        />
    );
};

export default ContactUpgradeModal;

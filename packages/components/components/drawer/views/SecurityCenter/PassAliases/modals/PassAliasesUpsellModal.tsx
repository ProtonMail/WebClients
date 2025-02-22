import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import UpsellModal from '@proton/components/components/upsell/modal/UpsellModal';
import { APP_UPSELL_REF_PATH, BRAND_NAME, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import identityImg from '@proton/styles/assets/img/illustrations/new-upsells-img/identity.svg';

interface Props {
    modalProps: ModalStateProps;
    upsellComponent?: UPSELL_COMPONENT;
}

const PassAliasesUpsellModal = ({ modalProps, upsellComponent }: Props) => {
    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: upsellComponent ?? UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.PASS_ALIASES,
    });

    return (
        <UpsellModal
            data-testid="security-center:proton-sentinel:upsell-modal"
            title={c('Title').t`Need more aliases?`}
            description={c('Description')
                .t`You’ve already created 10 aliases. Get unlimited aliases and 500 GB of storage with ${BRAND_NAME} Unlimited.`}
            modalProps={modalProps}
            illustration={identityImg}
            upsellRef={upsellRef}
        />
    );
};

export default PassAliasesUpsellModal;

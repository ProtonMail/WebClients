import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import UpsellModal from '@proton/components/components/upsell/modal/UpsellModal';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath, getUpsellRef } from '@proton/shared/lib/helpers/upsell';

interface Props {
    modalProps: ModalStateProps;
    upsellComponent?: UPSELL_COMPONENT;
}
const FiltersUpsellModal = ({ modalProps, upsellComponent }: Props) => {
    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: upsellComponent ?? UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.SHORT_ADDRESS,
        isSettings: true,
    });

    return (
        <UpsellModal
            title={c('Title').t`Activate @pm.me`}
            description={c('Description').t`Unlock shorter email addresses and other premium features by upgrading.`}
            modalProps={modalProps}
            upgradePath={addUpsellPath(getUpgradePath({}), upsellRef)}
            features={['more-storage', 'more-email-addresses', 'unlimited-folders-and-labels', 'custom-email-domains']}
        />
    );
};

export default FiltersUpsellModal;

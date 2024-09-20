import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import UpsellModal from '@proton/components/components/upsell/modal/UpsellModal';
import { useUser } from '@proton/components/hooks';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath, getUpsellRef } from '@proton/shared/lib/helpers/upsell';

interface Props {
    modalProps: ModalStateProps;
    upsellComponent?: UPSELL_COMPONENT;
}

const IncreasePrivacyUpsellModal = ({ modalProps, upsellComponent }: Props) => {
    const [user] = useUser();

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: upsellComponent ?? UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.UNLIMITED_ADDRESSES,
    });

    return (
        <UpsellModal
            title={c('Title').t`Increase your privacy with more addresses`}
            description={c('Description')
                .t`Separate different aspects of your life with multiple email addresses and unlock more premium features when you upgrade.`}
            modalProps={modalProps}
            upgradePath={addUpsellPath(getUpgradePath({ user }), upsellRef)}
            features={['more-storage', 'more-email-addresses', 'unlimited-folders-and-labels', 'custom-email-domains']}
        />
    );
};

export default IncreasePrivacyUpsellModal;

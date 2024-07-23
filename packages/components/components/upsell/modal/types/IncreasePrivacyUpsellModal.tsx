import { c } from 'ttag';

import { useUser } from '@proton/components/hooks';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath, getUpsellRef } from '@proton/shared/lib/helpers/upsell';

import type { ModalStateProps } from '../../../modalTwo';
import { UpsellModal } from '../index';

interface Props {
    modalProps: ModalStateProps;
}

const IncreasePrivacyUpsellModal = ({ modalProps }: Props) => {
    const [user] = useUser();

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
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

import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import UpsellModal from '@proton/components/components/upsell/UpsellModal';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import pmMeImg from '@proton/styles/assets/img/illustrations/new-upsells-img/pm-me.svg';

import UpsellFeatureList from '../UpsellFeatureList';

interface Props {
    modalProps: ModalStateProps;
    upsellComponent?: UPSELL_COMPONENT;
}

const IncreasePrivacyUpsellModal = ({ modalProps, upsellComponent }: Props) => {
    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: upsellComponent ?? UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.UNLIMITED_ADDRESSES,
    });

    return (
        <UpsellModal
            illustration={pmMeImg}
            title={c('Title').t`Increase your privacy with more addresses`}
            description={c('Description')
                .t`Separate different aspects of your life with multiple email addresses and unlock more premium features when you upgrade.`}
            customDescription={
                <>
                    <p className="text-left my-0 mb-2">
                        <strong>{c('Description').t`Also included`}</strong>
                    </p>
                    <div className="text-left">
                        <UpsellFeatureList
                            hideInfo
                            features={[
                                'more-storage',
                                'more-email-addresses',
                                'unlimited-folders-and-labels',
                                'custom-email-domains',
                            ]}
                        />
                    </div>
                </>
            }
            modalProps={modalProps}
            upsellRef={upsellRef}
        />
    );
};

export default IncreasePrivacyUpsellModal;

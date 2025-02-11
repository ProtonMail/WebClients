import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import {
    type APP_UPSELL_REF_PATH,
    DARK_WEB_MONITORING_NAME,
    MAIL_UPSELL_PATHS,
    type UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import dwmShield from '@proton/styles/assets/img/illustrations/dwm-upsell-shield.svg';

import { useMailUpsellConfig } from '../../useMailUpsellConfig';
import NewUpsellModal from '../NewUpsellModal';
import UpsellFeatureList from '../UpsellFeatureList';
import UpsellModal from '../UpsellModal';

interface Props {
    modalProps: ModalStateProps;
    upsellApp: APP_UPSELL_REF_PATH;
    upsellComponent: UPSELL_COMPONENT;
    onUpgrade?: () => void;
}

const DWMUpsellModal = ({ modalProps, upsellApp, upsellComponent, onUpgrade }: Props) => {
    const upsellRef = getUpsellRef({
        app: upsellApp,
        component: upsellComponent,
        feature: MAIL_UPSELL_PATHS.DARK_WEB_MONITORING,
    });

    const { upsellConfig, displayNewUpsellModalsVariant } = useMailUpsellConfig({ upsellRef });

    if (displayNewUpsellModalsVariant) {
        return (
            <NewUpsellModal
                titleModal={DARK_WEB_MONITORING_NAME}
                description={c('Description')
                    .t`Get notified if your password or other data was leaked from a third-party service.`}
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
                                    'more-premium-features',
                                ]}
                            />
                        </div>
                    </>
                }
                modalProps={modalProps}
                illustration={dwmShield}
                sourceEvent="BUTTON_DWM"
                onUpgrade={onUpgrade}
                {...upsellConfig}
            />
        );
    }

    return (
        <UpsellModal
            title={DARK_WEB_MONITORING_NAME}
            description={c('Description')
                .t`Get notified if your password or other data was leaked from a third-party service.`}
            modalProps={modalProps}
            features={[
                'more-storage',
                'more-email-addresses',
                'unlimited-folders-and-labels',
                'custom-email-domains',
                'more-premium-features',
            ]}
            sourceEvent="BUTTON_DWM"
            onUpgrade={onUpgrade}
            {...upsellConfig}
        />
    );
};

export default DWMUpsellModal;

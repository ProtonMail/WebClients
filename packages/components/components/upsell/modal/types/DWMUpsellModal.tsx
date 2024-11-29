import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef, useNewUpsellModalVariant } from '@proton/shared/lib/helpers/upsell';
import dwmShield from '@proton/styles/assets/img/illustrations/dwm-upsell-shield.svg';

import useOneDollarConfig from '../../useOneDollarPromo';
import useUpsellConfig from '../../useUpsellConfig';
import NewUpsellModal from '../NewUpsellModal';
import UpsellFeatureList from '../UpsellFeatureList';
import UpsellModal from '../UpsellModal';

interface Props {
    modalProps: ModalStateProps;
    upsellApp?: APP_UPSELL_REF_PATH;
    upsellComponent?: UPSELL_COMPONENT;
    onUpgrade?: () => void;
}

const DWMUpsellModal = ({ modalProps, upsellApp, upsellComponent, onUpgrade }: Props) => {
    const upsellRef = getUpsellRef({
        app: upsellApp ?? APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: upsellComponent ?? UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.DARK_WEB_MONITORING,
    });
    const displayNewUpsellModalsVariant = useNewUpsellModalVariant();

    const oneDollarConfig = useOneDollarConfig();
    const upsellConfig = useUpsellConfig({ upsellRef, ...oneDollarConfig });

    if (displayNewUpsellModalsVariant) {
        return (
            <NewUpsellModal
                titleModal={c('Title').t`Dark Web Monitoring`}
                description={
                    <>
                        <p className="text-wrap-balance color-weak mt-0 mb-6">
                            {c('Description')
                                .t`Get notified if your password or other data was leaked from a third-party service.`}
                        </p>
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
            title={c('Title').t`Dark Web Monitoring`}
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

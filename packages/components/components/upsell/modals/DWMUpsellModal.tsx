import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import {
    type APP_UPSELL_REF_PATH,
    DARK_WEB_MONITORING_NAME,
    MAIL_UPSELL_PATHS,
    type UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import illustration from '@proton/styles/assets/img/illustrations/dwm-upsell-shield.svg';

import UpsellFeatureList from '../UpsellFeatureList';
import UpsellModal from '../UpsellModal/UpsellModal';

interface Props {
    modalProps: ModalStateProps;
    upsellApp: APP_UPSELL_REF_PATH;
    upsellComponent: UPSELL_COMPONENT;
    onSubscribed?: () => void;
}

const DWMUpsellModal = ({ modalProps, upsellApp, upsellComponent, onSubscribed }: Props) => (
    <UpsellModal
        title={DARK_WEB_MONITORING_NAME}
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
        illustration={illustration}
        upsellRef={getUpsellRef({
            app: upsellApp,
            component: upsellComponent,
            feature: MAIL_UPSELL_PATHS.DARK_WEB_MONITORING,
        })}
        onSubscribed={onSubscribed}
    />
);

export default DWMUpsellModal;

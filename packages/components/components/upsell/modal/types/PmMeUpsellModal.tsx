import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import NewUpsellModal from '@proton/components/components/upsell/modal/NewUpsellModal';
import UpsellFeatureList from '@proton/components/components/upsell/modal/UpsellFeatureList';
import UpsellModal from '@proton/components/components/upsell/modal/UpsellModal';
import useOneDollarConfig from '@proton/components/components/upsell/useOneDollarPromo';
import useUpsellConfig from '@proton/components/components/upsell/useUpsellConfig';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef, useNewUpsellModalVariant } from '@proton/shared/lib/helpers/upsell';
import pmMeImg from '@proton/styles/assets/img/illustrations/new-upsells-img/pm-me.svg';

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
    const [user] = useUser();
    const activatePmUser = `${user.Name}@pm.me`;

    const oneDollarConfig = useOneDollarConfig();
    const upsellConfig = useUpsellConfig({ upsellRef, ...oneDollarConfig });

    const displayNewUpsellModalsVariant = useNewUpsellModalVariant();

    if (displayNewUpsellModalsVariant) {
        return (
            <NewUpsellModal
                titleModal={c('Title').t`Same inbox, shorter email address`}
                description={
                    <>
                        <p className="text-wrap-balance color-weak mt-0 mb-6">
                            {
                                // translator: full sentence is Upgrade to get <address@pm.me> for a shorter, easy-to-remember email address in addition to your current one.
                                c('Description')
                                    .t`Upgrade to get ${activatePmUser} for a shorter, easy-to-remember email address in addition to your current one.`
                            }
                        </p>
                        <p className="text-left">
                            <strong className="block mb-2">{c('Description').t`Also included`}</strong>
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
                        </p>
                    </>
                }
                modalProps={modalProps}
                illustration={pmMeImg}
                sourceEvent="BUTTON_SHORT_DOMAIN"
                {...upsellConfig}
            />
        );
    }

    return (
        <UpsellModal
            title={c('Title').t`Activate @pm.me`}
            description={c('Description').t`Unlock shorter email addresses and other premium features by upgrading.`}
            modalProps={modalProps}
            features={['more-storage', 'more-email-addresses', 'unlimited-folders-and-labels', 'custom-email-domains']}
            sourceEvent="BUTTON_SHORT_DOMAIN"
            {...upsellConfig}
        />
    );
};

export default FiltersUpsellModal;

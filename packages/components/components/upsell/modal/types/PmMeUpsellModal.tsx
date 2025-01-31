import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import NewUpsellModal from '@proton/components/components/upsell/modal/NewUpsellModal';
import UpsellFeatureList from '@proton/components/components/upsell/modal/UpsellFeatureList';
import UpsellModal from '@proton/components/components/upsell/modal/UpsellModal';
import { CYCLE } from '@proton/payments';
import { MAIL_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import type { Optional } from '@proton/shared/lib/interfaces';
import pmMeImg from '@proton/styles/assets/img/illustrations/new-upsells-img/pm-me.svg';

import { useMailUpsellConfig } from '../../useMailUpsellConfig';

interface Props {
    modalProps: ModalStateProps;
    upsellRefOptions: Optional<Parameters<typeof getUpsellRef>[0], 'feature'>;
}

const PmMeUpsellModal = ({ modalProps, upsellRefOptions }: Props) => {
    const upsellRef = getUpsellRef({
        feature: MAIL_UPSELL_PATHS.SHORT_ADDRESS,
        ...upsellRefOptions,
    });
    const [user] = useUser();
    const activatePmUser = `${user.Name}@pm.me`;

    const { upsellConfig, displayNewUpsellModalsVariant } = useMailUpsellConfig({
        upsellRef,
        cycle: user.isFree ? CYCLE.MONTHLY : CYCLE.YEARLY,
    });

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

export default PmMeUpsellModal;

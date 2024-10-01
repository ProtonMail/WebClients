import { c } from 'ttag';

import { NewUpsellModal, useUser } from '@proton/components';
import type { ModalStateProps } from '@proton/components';
import UpsellModal from '@proton/components/components/upsell/modal/UpsellModal';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import {
    addUpsellPath,
    getUpgradePath,
    getUpsellRef,
    useNewUpsellModalVariant,
} from '@proton/shared/lib/helpers/upsell';
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

    const displayNewUpsellModalsVariant = useNewUpsellModalVariant();

    if (displayNewUpsellModalsVariant) {
        return (
            <NewUpsellModal
                titleModal={c('Title').t`Same inbox, shorter email address`}
                description={
                    // translator: full sentence is Unlock <address@pm.me> for a catchy and easy-to-type email address.
                    c('Description').t`Unlock ${activatePmUser} for a catchy and easy-to-type email address.`
                }
                modalProps={modalProps}
                upgradePath={addUpsellPath(getUpgradePath({}), upsellRef)}
                illustration={pmMeImg}
                sourceEvent="BUTTON_SHORT_DOMAIN"
            />
        );
    }

    return (
        <UpsellModal
            title={c('Title').t`Activate @pm.me`}
            description={c('Description').t`Unlock shorter email addresses and other premium features by upgrading.`}
            modalProps={modalProps}
            upgradePath={addUpsellPath(getUpgradePath({}), upsellRef)}
            features={['more-storage', 'more-email-addresses', 'unlimited-folders-and-labels', 'custom-email-domains']}
            sourceEvent="BUTTON_SHORT_DOMAIN"
        />
    );
};

export default FiltersUpsellModal;

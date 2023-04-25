import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useConfig } from '@proton/components/hooks';
import { BRAND_NAME, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';

import { Alert, ModalProps, ModalTwo, ModalTwoHeader, useSettingsLink } from '../../../components';
import ModalContent from '../../../components/modalTwo/ModalContent';
import ModalFooter from '../../../components/modalTwo/ModalFooter';

const ContactUpgradeModal = ({ ...rest }: ModalProps) => {
    const goToSettings = useSettingsLink();
    const { APP_NAME } = useConfig();

    const handleConfirm = () => {
        const upsellAppRef = getUpsellRefFromApp({
            app: APP_NAME,
            feature: SHARED_UPSELL_PATHS.CONTACT_GROUP,
            component: UPSELL_COMPONENT.MODAL,
        });
        const settingsLink = addUpsellPath('/upgrade', upsellAppRef);
        goToSettings(settingsLink);
    };

    return (
        <ModalTwo size="small" {...rest}>
            <ModalTwoHeader title={c('Title').t`Upgrade required`} />
            <ModalContent>
                <Alert className="mb-4" type="warning">{c('Warning')
                    .t`This feature requires a paid ${BRAND_NAME} account`}</Alert>
            </ModalContent>
            <ModalFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Close`}</Button>
                <Button color="norm" onClick={handleConfirm}>{c('Action').t`Upgrade`}</Button>
            </ModalFooter>
        </ModalTwo>
    );
};

export default ContactUpgradeModal;

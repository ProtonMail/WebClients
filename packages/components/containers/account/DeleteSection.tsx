import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import Loader from '@proton/components/components/loader/Loader';
import { ADDRESS_TYPE, APPS, MAIL_APP_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';
import { hasMigrationDiscount, hasVisionary } from '@proton/shared/lib/helpers/subscription';

import { useModalState } from '../../components/modalTwo';
import { useAddresses, useConfig, useSubscription } from '../../hooks';
import { DiscountWarningModal, VisionaryWarningModal } from '../payments/subscription/PlanLossWarningModal';
import DeleteAccountModal from './DeleteAccountModal';
import MozillaInfoPanel from './MozillaInfoPanel';
import SettingsParagraph from './SettingsParagraph';

const DeleteSection = () => {
    const [addresses, loadingAddresses] = useAddresses();
    const [subscription, loadingSubscription] = useSubscription();
    const { APP_NAME } = useConfig();
    const [deleteAccountModalProps, setDeleteAccountModalOpen, renderDeleteAccountModal] = useModalState();
    const [migrationDiscountModalProps, setMigrationDiscountModal, renderDiscountModal] = useModalState();
    const [visionaryLossModalProps, setVisionaryLossModal, renderVisionaryLossModal] = useModalState();

    if (loadingAddresses || loadingSubscription) {
        return <Loader />;
    }

    if (
        APP_NAME === APPS.PROTONVPN_SETTINGS &&
        addresses?.some((address) => address.Type !== ADDRESS_TYPE.TYPE_EXTERNAL)
    ) {
        const loginLink = (
            <Href key="0" href="https://account.proton.me/login?product=mail">
                mail.proton.me
            </Href>
        );

        return (
            <SettingsParagraph>
                {c('Info')
                    .jt`Your ${VPN_APP_NAME} and ${MAIL_APP_NAME} accounts are linked. To delete them both, please sign in at ${loginLink} and delete your account there.`}
            </SettingsParagraph>
        );
    }

    if (subscription?.isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    return (
        <>
            {renderDiscountModal && (
                <DiscountWarningModal
                    type="delete"
                    {...migrationDiscountModalProps}
                    onConfirm={() => {
                        if (hasVisionary(subscription)) {
                            setVisionaryLossModal(true);
                            return;
                        }
                        setDeleteAccountModalOpen(true);
                    }}
                />
            )}
            {renderVisionaryLossModal && (
                <VisionaryWarningModal
                    type="delete"
                    {...visionaryLossModalProps}
                    onConfirm={() => {
                        setDeleteAccountModalOpen(true);
                    }}
                />
            )}
            {renderDeleteAccountModal && <DeleteAccountModal {...deleteAccountModalProps} />}
            <SettingsParagraph>
                {c('Info')
                    .t`This will permanently delete your account and all of its data. You will not be able to reactivate this account.`}
            </SettingsParagraph>
            <Button
                color="danger"
                shape="outline"
                id="deleteButton"
                onClick={() => {
                    if (hasMigrationDiscount(subscription)) {
                        setMigrationDiscountModal(true);
                        return;
                    }
                    if (hasVisionary(subscription)) {
                        setVisionaryLossModal(true);
                        return;
                    }
                    setDeleteAccountModalOpen(true);
                }}
            >
                {c('Action').t`Delete your account`}
            </Button>
        </>
    );
};

export default DeleteSection;

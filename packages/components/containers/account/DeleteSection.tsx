import type { ReactNode } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { Button } from '@proton/atoms/Button/Button';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Href } from '@proton/atoms/Href/Href';
import { IcTrashCross } from '@proton/icons/icons/IcTrashCross';
import { hasMigrationDiscount, hasVisionary } from '@proton/payments/core/subscription/helpers';
import { ADDRESS_TYPE, APPS, MAIL_APP_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';

import Loader from '../../components/loader/Loader';
import useModalState from '../../components/modalTwo/useModalState';
import { DiscountWarningModal, VisionaryWarningModal } from '../payments/subscription/PlanLossWarningModal';
import DeleteAccountModal from './DeleteAccountModal';
import SettingsParagraph from './SettingsParagraph';

interface Props {
    deleteButtonFullWidth?: boolean;
    deleteButtonText?: ReactNode;
}

const DeleteSection = (props: Props) => {
    const { deleteButtonFullWidth = false, deleteButtonText = c('Action').t`Delete your account` } = props;

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
            <DashboardGrid>
                <DashboardGridSectionHeader
                    title={c('Title').t`Delete account`}
                    subtitle={c('Info')
                        .t`This will permanently delete your account and all of its data. You will not be able to reactivate this account.`}
                />
                <div>
                    <Button
                        color="danger"
                        shape="outline"
                        id="deleteButton"
                        fullWidth={deleteButtonFullWidth}
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
                        <span className="flex gap-2 items-center justify-center">
                            <IcTrashCross />
                            {deleteButtonText}
                        </span>
                    </Button>
                </div>
            </DashboardGrid>
        </>
    );
};

export default DeleteSection;

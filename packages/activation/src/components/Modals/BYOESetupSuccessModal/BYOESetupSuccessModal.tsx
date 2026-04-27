import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, useSettingsLink } from '@proton/components';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import { APPS, BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import byoeSetupSuccess from '@proton/styles/assets/img/illustrations/byoe-setup-success.svg';

interface Props extends ModalProps {
    connectedAddress: string;
    onComplete?: () => Promise<void>;
}

export const BYOESetupSuccessModal = ({ onClose, onComplete, connectedAddress, ...rest }: Props) => {
    const location = useLocation();
    const goToSettings = useSettingsLink();

    // If we're already in the correct settings section, no need to show the button
    const showManageAddressesButton = !location.pathname.includes('identity-addresses');

    const connectedAddressText = <b key="connectedAddress">{connectedAddress}</b>;

    const handleClose = async () => {
        onClose?.();
        void onComplete?.();
    };

    return (
        <ModalTwo size="small" {...rest} onClose={handleClose}>
            <ModalTwoHeader />
            <ModalTwoContent className="flex">
                <div className="justify-center items-center text-center w-full">
                    <img src={byoeSetupSuccess} alt="" width={260} height={148} />
                    <div className="text-bold text-xl">{c('Title').t`You are all set`}</div>
                </div>
                <ul className="color-weak mt-2">
                    <li>{c('Description')
                        .jt`Emails sent to ${connectedAddressText} will now show up in ${MAIL_APP_NAME}.`}</li>
                    <li>{c('Description').t`You can now send emails from ${BRAND_NAME} using this address.`}</li>
                    <li>{c('Description')
                        .t`We've started importing your last 180 days of emails from Gmail. We'll let you know when it's done.`}</li>
                </ul>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button
                    color="norm"
                    className="w-full inline-flex items-center justify-center gap-2"
                    onClick={handleClose}
                >
                    {c('Action').t`Done`}
                </Button>
                {showManageAddressesButton && (
                    <Button
                        className="w-full"
                        onClick={async () => {
                            await onComplete?.();
                            goToSettings('/identity-addresses#addresses', APPS.PROTONMAIL);
                        }}
                    >{c('Action').t`Manage addresses`}</Button>
                )}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

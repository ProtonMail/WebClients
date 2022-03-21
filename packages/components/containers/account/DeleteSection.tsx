import { APPS, MAIL_APP_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';
import { c } from 'ttag';
import { Href, Button, Loader } from '../../components';
import { useAddresses, useConfig, useSubscription } from '../../hooks';
import { useModalState } from '../../components/modalTwo';

import MozillaInfoPanel from './MozillaInfoPanel';
import DeleteAccountModal from './DeleteAccountModal';
import SettingsParagraph from './SettingsParagraph';

const DeleteSection = () => {
    const [addresses, loadingAddresses] = useAddresses();
    const [subscription, loadingSubscription] = useSubscription();
    const { APP_NAME } = useConfig();
    const [deleteAccountModalProps, setDeleteAccountModalOpen] = useModalState();

    if (loadingAddresses || loadingSubscription) {
        return <Loader />;
    }

    if (APP_NAME === APPS.PROTONVPN_SETTINGS && addresses.length) {
        const loginLink = (
            <Href key="0" url="https://mail.protonmail.com/login">
                mail.protonmail.com
            </Href>
        );

        return (
            <SettingsParagraph>
                {c('Info')
                    .jt`Your ${VPN_APP_NAME} and ${MAIL_APP_NAME} accounts are linked. To delete them both, please log in at ${loginLink} and delete your account there.`}
            </SettingsParagraph>
        );
    }

    if (subscription?.isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    return (
        <>
            <DeleteAccountModal {...deleteAccountModalProps} />
            <SettingsParagraph>
                {c('Info')
                    .t`This will permanently delete your account and all of its data. You will not be able to reactivate this account.`}
            </SettingsParagraph>
            <Button color="danger" shape="outline" id="deleteButton" onClick={() => setDeleteAccountModalOpen(true)}>
                {c('Action').t`Delete your account`}
            </Button>
        </>
    );
};

export default DeleteSection;

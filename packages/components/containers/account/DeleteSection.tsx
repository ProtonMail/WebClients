import { APPS } from '@proton/shared/lib/constants';
import { c } from 'ttag';
import { Href, Button, Loader } from '../../components';
import { useModals, useUser, useSubscription, useAddresses, useConfig } from '../../hooks';

import MozillaInfoPanel from './MozillaInfoPanel';
import DeleteAccountModal from './DeleteAccountModal';
import SettingsParagraph from './SettingsParagraph';

const DeleteSection = () => {
    const [{ isMember }] = useUser();
    const [addresses, loadingAddresses] = useAddresses();
    const [subscription, loadingSubscription] = useSubscription();
    const { createModal } = useModals();
    const { APP_NAME } = useConfig();

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
                    .jt`Your ProtonVPN and ProtonMail accounts are linked. To delete them both, please log in at ${loginLink} and delete your account there.`}
            </SettingsParagraph>
        );
    }

    if (isMember) {
        return null;
    }

    if (subscription?.isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    return (
        <>
            <SettingsParagraph>
                {c('Info')
                    .t`This will permanently delete your account and all of its data. You will not be able to reactivate this account.`}
            </SettingsParagraph>
            <Button
                color="danger"
                shape="outline"
                id="deleteButton"
                onClick={() => createModal(<DeleteAccountModal />)}
            >
                {c('Action').t`Delete your account`}
            </Button>
        </>
    );
};

export default DeleteSection;

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import { APPS } from '@proton/shared/lib/constants';

import { SettingsLink } from '../../components';
import { useOrganization } from '../../hooks';

interface Props {
    onClose?: () => void;
}

const AddressesSection = ({ onClose }: Props) => {
    const [organization] = useOrganization();

    if (!organization?.HasKeys) {
        return (
            <div className="mb-4">
                <ButtonLike
                    as={SettingsLink}
                    onClick={() => onClose?.()}
                    path="/identity-addresses#addresses"
                    app={APPS.PROTONMAIL}
                >{c('Action').t`Add address`}</ButtonLike>
            </div>
        );
    }

    if (organization?.MaxMembers > 1) {
        return (
            <>
                <Alert className="mb-4">{c('Info for domain modal')
                    .t`Add a new user to your organization and create an address for it.`}</Alert>
                <div className="mb-4">
                    <ButtonLike as={SettingsLink} color="norm" onClick={() => onClose?.()} path="/users-addresses">{c(
                        'Action'
                    ).t`Add user`}</ButtonLike>
                </div>
                <Alert className="mb-4">{c('Info for domain modal')
                    .t`Add a new address for the existing users of your organization.`}</Alert>
                <div className="mb-4">
                    <ButtonLike as={SettingsLink} color="norm" onClick={() => onClose?.()} path="/users-addresses">{c(
                        'Action'
                    ).t`Add address`}</ButtonLike>
                </div>
            </>
        );
    }

    return (
        <div className="mb-4">
            <ButtonLike as={SettingsLink} onClick={() => onClose?.()} path="/users-addresses">{c('Action')
                .t`Add address`}</ButtonLike>
        </div>
    );
};

export default AddressesSection;

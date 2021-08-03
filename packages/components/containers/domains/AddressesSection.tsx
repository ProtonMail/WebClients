import { c } from 'ttag';

import { Alert, ButtonLike, SettingsLink } from '../../components';
import { useOrganization } from '../../hooks';

interface Props {
    onClose?: () => void;
}

const AddressesSection = ({ onClose }: Props) => {
    const [organization] = useOrganization();

    if (organization?.MaxMembers > 1) {
        return (
            <>
                <Alert>{c('Info for domain modal')
                    .t`Add a new user to your organization and create an address for it.`}</Alert>
                <div className="mb1">
                    <ButtonLike as={SettingsLink} color="norm" onClick={() => onClose?.()} path="/users-addresses">{c(
                        'Action'
                    ).t`Add user`}</ButtonLike>
                </div>
                <Alert>{c('Info for domain modal').t`Add a new address for any user of your organization.`}</Alert>
                <div className="mb1">
                    <ButtonLike as={SettingsLink} color="norm" onClick={() => onClose?.()} path="/users-addresses">{c(
                        'Action'
                    ).t`Add address`}</ButtonLike>
                </div>
            </>
        );
    }

    return (
        <div className="mb1">
            <ButtonLike as={SettingsLink} onClick={() => onClose?.()} path="/users-addresses">{c('Action')
                .t`Add address`}</ButtonLike>
        </div>
    );
};

export default AddressesSection;

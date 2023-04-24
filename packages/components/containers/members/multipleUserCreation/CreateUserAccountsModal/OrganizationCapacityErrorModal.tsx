import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalProps, Prompt, SettingsLink } from '@proton/components';

import { ORGANIZATION_CAPACITY_ERROR_TYPE, OrganizationCapacityError } from './validateOrganizationCapacity';

interface Props extends ModalProps {
    error: OrganizationCapacityError;
    onOk: () => void;
}

const OrganizationCapacityErrorModal = ({ error, onOk, ...rest }: Props) => {
    const upgradeLink = <SettingsLink path="/dashboard">{c('Link').t`Upgrade your plan`}</SettingsLink>;
    const cta = (() => {
        if (error.type === ORGANIZATION_CAPACITY_ERROR_TYPE.MEMBER) {
            // translator: Full sentence "Upgrade your plan to add more users, or remove some user accounts to free up space."
            return c('Organization capacity error')
                .jt`${upgradeLink} to add more users, or remove some user accounts to free up space.`;
        }

        if (error.type === ORGANIZATION_CAPACITY_ERROR_TYPE.SPACE) {
            // translator: Full sentence "Upgrade your plan to get more storage, or remove some storage to free up space."
            return c('Organization capacity error')
                .jt`${upgradeLink} to get more storage, or remove some storage to free up space.`;
        }

        if (error.type === ORGANIZATION_CAPACITY_ERROR_TYPE.ADDRESSES) {
            // translator: Full sentence "Upgrade your plan to get more addresses, or remove some addresses to free up space."
            return c('Organization capacity error')
                .jt`${upgradeLink} to get more addresses, or remove some addresses to free up space.`;
        }

        if (error.type === ORGANIZATION_CAPACITY_ERROR_TYPE.VPNS) {
            // translator: Full sentence "Upgrade your plan to get more accounts, or remove VPN access from some users."
            return c('Organization capacity error')
                .jt`${upgradeLink} to get more accounts, or remove VPN access from some users.`;
        }

        throw new Error(`ORGANIZATION_CAPACITY_ERROR_TYPE ${error.type} not handled`);
    })();

    return (
        <Prompt
            title={c('Title').t`Couldn’t create accounts`}
            buttons={[<Button onClick={onOk}>{c('Action').t`Got it`}</Button>]}
            {...rest}
        >
            <p className="mt-0">{error.message}</p>
            <p className="mb-0">{cta}</p>
        </Prompt>
    );
};

export default OrganizationCapacityErrorModal;

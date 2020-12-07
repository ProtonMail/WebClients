import React from 'react';
import { c } from 'ttag';
import { APPS } from 'proton-shared/lib/constants';

import { Alert, Block, AppLink } from '../../components';
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
                <Block>
                    <AppLink
                        className="pm-button pm-button--primary"
                        onClick={() => onClose?.()}
                        to="/organization#members"
                        toApp={APPS.PROTONACCOUNT}
                    >{c('Action').t`Add user`}</AppLink>
                </Block>
                <Alert>{c('Info for domain modal').t`Add a new address for any user of your organization.`}</Alert>
                <Block>
                    <AppLink
                        className="pm-button pm-button--primary"
                        onClick={() => onClose?.()}
                        to="/organization#addresses"
                        toApp={APPS.PROTONACCOUNT}
                    >{c('Action').t`Add address`}</AppLink>
                </Block>
            </>
        );
    }

    return (
        <Block>
            <AppLink
                className="pm-button pm-button--primary"
                onClick={() => onClose?.()}
                to="/organization#addresses"
                toApp={APPS.PROTONACCOUNT}
            >{c('Action').t`Add address`}</AppLink>
        </Block>
    );
};

export default AddressesSection;

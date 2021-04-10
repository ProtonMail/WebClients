import React from 'react';
import { useRouteMatch } from 'react-router';
import { c } from 'ttag';
import { APPS } from 'proton-shared/lib/constants';

import { Alert, AppLink, ButtonLike } from '../../components';
import { useOrganization } from '../../hooks';

interface Props {
    onClose?: () => void;
}

const AddressesSection = ({ onClose }: Props) => {
    const [organization] = useOrganization();

    const match = useRouteMatch<{ slug: string }>('/:slug');

    const slug = match?.params.slug;

    if (organization?.MaxMembers > 1) {
        return (
            <>
                <Alert>{c('Info for domain modal')
                    .t`Add a new user to your organization and create an address for it.`}</Alert>
                <div className="mb1">
                    <ButtonLike
                        as={AppLink}
                        color="norm"
                        onClick={() => onClose?.()}
                        to={`/${slug}/users-addresses`}
                        toApp={APPS.PROTONACCOUNT}
                    >{c('Action').t`Add user`}</ButtonLike>
                </div>
                <Alert>{c('Info for domain modal').t`Add a new address for any user of your organization.`}</Alert>
                <div className="mb1">
                    <ButtonLike
                        as={AppLink}
                        color="norm"
                        onClick={() => onClose?.()}
                        to={`/${slug}/users-addresses`}
                        toApp={APPS.PROTONACCOUNT}
                    >{c('Action').t`Add address`}</ButtonLike>
                </div>
            </>
        );
    }

    return (
        <div className="mb1">
            <ButtonLike
                as={AppLink}
                onClick={() => onClose?.()}
                to={`/${slug}/users-addresses`}
                toApp={APPS.PROTONACCOUNT}
            >{c('Action').t`Add address`}</ButtonLike>
        </div>
    );
};

export default AddressesSection;

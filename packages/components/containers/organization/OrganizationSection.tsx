import React from 'react';
import { c } from 'ttag';
import { Organization } from 'proton-shared/lib/interfaces';

import { Alert, Row, Field, Label, PrimaryButton, Loader } from '../../components';
import { useModals } from '../../hooks';
import RestoreAdministratorPrivileges from './RestoreAdministratorPrivileges';
import OrganizationNameModal from './OrganizationNameModal';
import ActivateOrganizationButton from './ActivateOrganizationButton';

interface Props {
    organization?: Organization;
}

const OrganizationSection = ({ organization }: Props) => {
    const { createModal } = useModals();

    if (!organization) {
        return <Loader />;
    }

    if (!organization.HasKeys) {
        return (
            <>
                <Alert learnMore="https://protonmail.com/support/knowledge-base/business/">{c('Info')
                    .t`Create and manage sub-accounts and assign them email addresses on your custom domain.`}</Alert>
                <ActivateOrganizationButton organization={organization} />
            </>
        );
    }

    const organizationName = organization.Name;

    return (
        <>
            <RestoreAdministratorPrivileges />
            <Alert>{c('Info').t`The name will be visible to your users while they are logged in.`}</Alert>
            <Row>
                <Label>{c('Label').t`Organization name`}</Label>
                <Field className="pt0-5">
                    <div className="bold ellipsis">{organizationName}</div>
                </Field>
                <div className="ml1 onmobile-ml0">
                    <PrimaryButton
                        onClick={() => createModal(<OrganizationNameModal organizationName={organizationName} />)}
                    >{c('Action').t`Edit`}</PrimaryButton>
                </div>
            </Row>
        </>
    );
};

export default OrganizationSection;

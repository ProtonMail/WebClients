import React from 'react';
import { c } from 'ttag';
import { Alert, Row, Loader, Field, Label, PrimaryButton, useModals, useOrganization } from '../../index';

import RestoreAdministratorPrivileges from './RestoreAdministratorPrivileges';
import OrganizationNameModal from './OrganizationNameModal';
import ActivateOrganizationButton from './ActivateOrganizationButton';

const OrganizationSection = () => {
    const [organization, loadingOrganization] = useOrganization();
    const { createModal } = useModals();

    if (loadingOrganization) {
        return <Loader />;
    }
    const { Name } = organization;

    if (!organization.HasKeys) {
        return (
            <>
                <Alert learnMore="https://protonmail.com/support/knowledge-base/business/">{c('Info')
                    .t`Create and manage sub-accounts and assign them email addresses on your custom domain.`}</Alert>
                <ActivateOrganizationButton />
            </>
        );
    }

    return (
        <>
            <RestoreAdministratorPrivileges />
            <Alert>{c('Info').t`The name will be visible to your users while they are logged in.`}</Alert>
            <Row>
                <Label>{c('Label').t`Organization name`}</Label>
                <Field className="pt0-5">
                    <div className="bold ellipsis">{Name}</div>
                </Field>
                <div className="ml1 onmobile-ml0">
                    <PrimaryButton onClick={() => createModal(<OrganizationNameModal organizationName={Name} />)}>{c(
                        'Action'
                    ).t`Edit`}</PrimaryButton>
                </div>
            </Row>
        </>
    );
};

export default OrganizationSection;

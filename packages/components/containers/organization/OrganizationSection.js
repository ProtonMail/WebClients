import React from 'react';
import { c } from 'ttag';
import { SubTitle, Alert, Row, Loader, Field, Label, SmallButton, useModals, useOrganization } from 'react-components';

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
                <SubTitle>{c('Title').t`Multi-user support`}</SubTitle>
                <Alert learnMore="https://protonmail.com/support/knowledge-base/business/">{c('Info')
                    .t`Create and manage sub-accounts and assign them email addresses on your custom domain.`}</Alert>
                <ActivateOrganizationButton />
            </>
        );
    }

    return (
        <>
            <RestoreAdministratorPrivileges />
            <SubTitle>{c('Title').t`Organization`}</SubTitle>
            <Alert>{c('Info')
                .t`The name and logo will be visible to your users while logged in at mail.protonmail.com.`}</Alert>
            <Row>
                <Label>{c('Label').t`Organization name`}</Label>
                <Field>
                    <span className="mr0-5">{Name}</span>
                    <SmallButton onClick={() => createModal(<OrganizationNameModal organizationName={Name} />)}>{c(
                        'Action'
                    ).t`Edit`}</SmallButton>
                </Field>
            </Row>
        </>
    );
};

export default OrganizationSection;

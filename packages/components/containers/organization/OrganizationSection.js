import React from 'react';
import { c } from 'ttag';
import {
    SubTitle,
    Alert,
    Row,
    Loader,
    Field,
    Label,
    PrimaryButton,
    useModals,
    useOrganization
} from 'react-components';

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
            <Alert>{c('Info').t`The name and logo will be visible to your users while they are logged in.`}</Alert>
            <Row>
                <Label>{c('Label').t`Organization name`}</Label>
                <Field className="pt0-5">
                    <div className="bold ellipsis">{Name}</div>
                </Field>
                <div className="ml1">
                    <PrimaryButton onClick={() => createModal(<OrganizationNameModal organizationName={Name} />)}>{c(
                        'Action'
                    ).t`Edit`}</PrimaryButton>
                </div>
            </Row>
        </>
    );
};

export default OrganizationSection;

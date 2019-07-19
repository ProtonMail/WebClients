import React from 'react';
import { c } from 'ttag';
import { Link } from 'react-router-dom';
import { SubTitle, Alert, Row, Loader, Field, Label, SmallButton, useModals, useOrganization } from 'react-components';
import humanSize from 'proton-shared/lib/helpers/humanSize';

import RestoreAdministratorPrivileges from './RestoreAdministratorPrivileges';
import OrganizationNameModal from './OrganizationNameModal';
import ActivateOrganizationButton from './ActivateOrganizationButton';

const OrganizationSection = () => {
    const [organization, loadingOrganization] = useOrganization();
    const { createModal } = useModals();

    if (loadingOrganization) {
        return <Loader />;
    }
    const {
        Name,
        UsedMembers,
        MaxMembers,
        MaxSpace,
        UsedVPN,
        MaxVPN,
        UsedDomains,
        MaxDomains,
        UsedAddresses,
        MaxAddresses
    } = organization;

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
            <Alert learnMore="todo">{c('Info')
                .t`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed pretium enim nec massa fringilla, ac ultrices tortor posuere. Fusce sed quam vitae arcu pharetra congue. Quisque in elementum nibh.`}</Alert>
            <Row>
                <Label>{c('Label').t`Organization name`}</Label>
                <Field>
                    <span className="mr0-5">{Name}</span>
                    <SmallButton onClick={() => createModal(<OrganizationNameModal organizationName={Name} />)}>{c(
                        'Action'
                    ).t`Edit`}</SmallButton>
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Number of users`}</Label>
                <Field>
                    {`${UsedMembers}/${MaxMembers}`} <Link to="todo">{c('Link').t`Upgrade`}</Link>
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Organization storage`}</Label>
                <Field>
                    {humanSize(MaxSpace)} <Link to="todo">{c('Link').t`Upgrade`}</Link>
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`VPN connections`}</Label>
                <Field>
                    {`${UsedVPN}/${MaxVPN}`} <Link to="todo">{c('Link').t`Upgrade`}</Link>
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Addresses`}</Label>
                <Field>
                    {`${UsedAddresses}/${MaxAddresses}`} <Link to="todo">{c('Link').t`Upgrade`}</Link>
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Domains`}</Label>
                <Field>
                    {`${UsedDomains}/${MaxDomains}`} <Link to="todo">{c('Link').t`Upgrade`}</Link>
                </Field>
            </Row>
        </>
    );
};

export default OrganizationSection;

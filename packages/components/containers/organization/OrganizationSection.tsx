import React from 'react';
import { c } from 'ttag';
import { Organization } from 'proton-shared/lib/interfaces';
import { APPS } from 'proton-shared/lib/constants';
import { hasMailProfessional, hasVisionary } from 'proton-shared/lib/helpers/subscription';

import { Row, Field, Label, Loader, Button, ButtonLike, SettingsLink } from '../../components';
import { useConfig, useModals, useSubscription } from '../../hooks';
import RestoreAdministratorPrivileges from './RestoreAdministratorPrivileges';
import OrganizationNameModal from './OrganizationNameModal';
import ActivateOrganizationButton from './ActivateOrganizationButton';
import { SettingsParagraph } from '../account';

interface Props {
    organization?: Organization;
}

const OrganizationSection = ({ organization }: Props) => {
    const { createModal } = useModals();
    const { APP_NAME } = useConfig();
    const [subscription, loadingSubscription] = useSubscription();

    if (!organization || loadingSubscription) {
        return <Loader />;
    }

    if (!hasMailProfessional(subscription) && !hasVisionary(subscription)) {
        return (
            <>
                <SettingsParagraph>
                    {c('Info')
                        .t`To create email addresses for other people, manage ProtonMail for a business, school, or group. Upgrade to a plan that supports Multi-User (Visionary or Professional).`}
                </SettingsParagraph>
                <ButtonLike color="norm" as={SettingsLink} path="/dashboard" app={APP_NAME} target="_self">
                    {c('Action').t`Upgrade`}
                </ButtonLike>
            </>
        );
    }

    if (organization.UsedDomains === 0) {
        return (
            <>
                <SettingsParagraph>
                    {c('Info')
                        .t`Create email addresses for other people, manage ProtonMail for a business, school, or group. Get started by adding your organization name and custom domain (e.g. @yourcompany.com). `}
                </SettingsParagraph>
                <ButtonLike color="norm" as={SettingsLink} path="/domain-names" app={APPS.PROTONMAIL} target="_self">
                    {c('Action').t`Add domain`}
                </ButtonLike>
            </>
        );
    }

    if (!organization.HasKeys) {
        return (
            <>
                <SettingsParagraph learnMoreUrl="https://protonmail.com/support/knowledge-base/business/">
                    {c('Info').t`Create and manage sub-accounts and assign them email addresses on your custom domain.`}
                </SettingsParagraph>
                <ActivateOrganizationButton organization={organization} />
            </>
        );
    }

    const organizationName = organization.Name;

    return (
        <>
            <RestoreAdministratorPrivileges />
            <SettingsParagraph>
                {c('Info').t`The name will be visible to your users while they are logged in.`}
            </SettingsParagraph>
            <Row>
                <Label htmlFor="organization-name-edit-button">{c('Label').t`Organization name`}</Label>
                <Field className="pt0-5">
                    <div className="text-bold text-ellipsis">{organizationName}</div>
                </Field>
                <div className="ml1 on-mobile-ml0">
                    <Button
                        id="organization-name-edit-button"
                        color="norm"
                        onClick={() => createModal(<OrganizationNameModal organizationName={organizationName} />)}
                    >{c('Action').t`Edit`}</Button>
                </div>
            </Row>
        </>
    );
};

export default OrganizationSection;

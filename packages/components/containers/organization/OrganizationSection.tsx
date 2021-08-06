import { c } from 'ttag';
import { Organization } from '@proton/shared/lib/interfaces';
import { APPS, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import { hasMailProfessional, hasVisionary } from '@proton/shared/lib/helpers/subscription';
import { unlockPasswordChanges } from '@proton/shared/lib/api/user';

import { Row, Field, Label, Loader, Button, ButtonLike, SettingsLink, PrimaryButton } from '../../components';
import { useModals, useNotifications, useSubscription } from '../../hooks';
import OrganizationNameModal from './OrganizationNameModal';
import { SettingsParagraph, SettingsSectionWide, UpgradeBanner } from '../account';
import AuthModal from '../password/AuthModal';
import SetupOrganizationModal from './SetupOrganizationModal';

interface Props {
    organization?: Organization;
    onSetupOrganization?: () => void;
}

const OrganizationSection = ({ organization, onSetupOrganization }: Props) => {
    const { createModal } = useModals();
    const [subscription, loadingSubscription] = useSubscription();

    const { createNotification } = useNotifications();

    if (!organization || loadingSubscription) {
        return <Loader />;
    }

    if (!hasMailProfessional(subscription) && !hasVisionary(subscription)) {
        return (
            <SettingsSectionWide>
                <SettingsParagraph>
                    {c('Info')
                        .t`ProtonMail lets you create email addresses for other people. This is perfect for businesses, families, or groups.`}
                </SettingsParagraph>

                <UpgradeBanner>
                    {c('Info').t`Upgrade to a ${PLAN_NAMES[PLANS.VISIONARY]} or ${
                        PLAN_NAMES[PLANS.PROFESSIONAL]
                    } plan to get started.`}
                </UpgradeBanner>
            </SettingsSectionWide>
        );
    }

    if (organization.UsedDomains === 0) {
        return (
            <>
                <SettingsParagraph>
                    {c('Info')
                        .t`Create email addresses for other people, manage ProtonMail for a business, school, or group. Get started by adding your organization name and custom domain (e.g. @yourcompany.com). `}
                </SettingsParagraph>
                <ButtonLike color="norm" as={SettingsLink} path="/domain-names" app={APPS.PROTONMAIL}>
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
                <PrimaryButton
                    onClick={async () => {
                        if (organization?.MaxMembers === 1) {
                            return createNotification({
                                type: 'error',
                                text: c('Error')
                                    .t`Please upgrade to a Professional plan with more than 1 user, or a Visionary account, to get multi-user support.`,
                            });
                        }

                        await new Promise((resolve, reject) => {
                            createModal(
                                <AuthModal onClose={reject} onSuccess={resolve} config={unlockPasswordChanges()} />
                            );
                        });
                        onSetupOrganization?.();
                        createModal(<SetupOrganizationModal />);
                    }}
                >{c('Action').t`Enable multi-user support`}</PrimaryButton>
            </>
        );
    }

    const organizationName = organization.Name;

    return (
        <>
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

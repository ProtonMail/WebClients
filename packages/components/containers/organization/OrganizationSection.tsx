import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { Button } from '@proton/atoms';
import { unlockPasswordChanges } from '@proton/shared/lib/api/user';
import { APPS, APP_NAMES, BRAND_NAME, MAIL_APP_NAME, SHARED_UPSELL_PATHS } from '@proton/shared/lib/constants';
import {
    getHasB2BPlan,
    hasFree,
    hasMailProfessional,
    hasNewVisionary,
    hasVisionary,
} from '@proton/shared/lib/helpers/subscription';
import { getUpsellAppRef } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Audience, Organization } from '@proton/shared/lib/interfaces';

import { Field, Label, Loader, PrimaryButton, Row, SettingsLink } from '../../components';
import { useConfig, useModals, useNotifications, useSubscription } from '../../hooks';
import { SettingsParagraph, SettingsSectionWide, UpgradeBanner } from '../account';
import AuthModal from '../password/AuthModal';
import OrganizationNameModal from './OrganizationNameModal';
import SetupOrganizationModal from './SetupOrganizationModal';

interface Props {
    app: APP_NAMES;
    organization?: Organization;
    onSetupOrganization?: () => void;
}

const OrganizationSection = ({ app, organization, onSetupOrganization }: Props) => {
    const { APP_NAME } = useConfig();
    const { createModal } = useModals();
    const [subscription, loadingSubscription] = useSubscription();

    const { createNotification } = useNotifications();

    if (!organization || loadingSubscription) {
        return <Loader />;
    }

    if (
        !hasMailProfessional(subscription) &&
        !hasVisionary(subscription) &&
        !hasNewVisionary(subscription) &&
        !getHasB2BPlan(subscription)
    ) {
        return (
            <SettingsSectionWide>
                <SettingsParagraph>
                    {c('new_plans: info')
                        .t`${BRAND_NAME} lets you create email addresses and manage accounts for sub-users. Ideal for families and organizations.`}
                </SettingsParagraph>

                <UpgradeBanner
                    free={hasFree(subscription)}
                    audience={Audience.B2B}
                    upsellPath={getUpsellAppRef(APP_NAME, SHARED_UPSELL_PATHS.MULTI_USER, app)}
                >{c('new_plans: upgrade').t`Included with all ${BRAND_NAME} for Business plans.`}</UpgradeBanner>
            </SettingsSectionWide>
        );
    }

    if (organization.UsedDomains === 0) {
        return (
            <>
                <SettingsParagraph>
                    {c('Info')
                        .t`Create email addresses for other people, manage ${MAIL_APP_NAME} for a business, school, or group. Get started by adding your organization name and custom domain (e.g. @yourcompany.com). `}
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
                <SettingsParagraph learnMoreUrl={getKnowledgeBaseUrl('/proton-for-business')}>
                    {c('Info').t`Create and manage sub-accounts and assign them email addresses on your custom domain.`}
                </SettingsParagraph>
                <PrimaryButton
                    onClick={async () => {
                        if (organization?.MaxMembers === 1) {
                            return createNotification({
                                type: 'error',
                                text: c('Error')
                                    .t`Please upgrade to a business plan with more than 1 user to get multi-user support`,
                            });
                        }

                        await new Promise((resolve, reject) => {
                            createModal(
                                <AuthModal onCancel={reject} onSuccess={resolve} config={unlockPasswordChanges()} />
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

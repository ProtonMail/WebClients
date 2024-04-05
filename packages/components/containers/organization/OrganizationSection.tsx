import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import { createPreAuthKTVerifier } from '@proton/components/containers';
import useKTActivation from '@proton/components/containers/keyTransparency/useKTActivation';
import useLoading from '@proton/hooks/useLoading';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { unlockPasswordChanges } from '@proton/shared/lib/api/user';
import innerMutatePassword from '@proton/shared/lib/authentication/mutate';
import {
    APPS,
    APP_NAMES,
    BRAND_NAME,
    DRIVE_APP_NAME,
    MAIL_APP_NAME,
    SHARED_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getHasMemberCapablePlan, hasFamily } from '@proton/shared/lib/helpers/subscription';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Audience, Organization } from '@proton/shared/lib/interfaces';
import { handleSetupAddressKeys } from '@proton/shared/lib/keys';
import { Credentials } from '@proton/shared/lib/srp';

import { Field, Label, Loader, PrimaryButton, Row, SettingsLink, useAppLink } from '../../components';
import {
    useApi,
    useAuthentication,
    useConfig,
    useGetAddresses,
    useModals,
    useNotifications,
    useSubscription,
    useUser,
} from '../../hooks';
import { SettingsParagraph, SettingsSection, SettingsSectionWide, UpgradeBanner } from '../account';
import AuthModal from '../password/AuthModal';
import OrganizationNameModal from './OrganizationNameModal';
import SetupOrganizationModal from './SetupOrganizationModal';

interface Props {
    app: APP_NAMES;
    organization?: Organization;
}

const OrganizationSection = ({ app, organization }: Props) => {
    const { APP_NAME } = useConfig();
    const { createModal } = useModals();
    const [user] = useUser();
    const getAddresses = useGetAddresses();
    const api = useApi();
    const [subscription] = useSubscription();
    const appLink = useAppLink();
    const [loading, withLoading] = useLoading();
    const ktActivation = useKTActivation();
    const authentication = useAuthentication();

    const { createNotification } = useNotifications();
    const isPartOfFamily = hasFamily(subscription);

    if (!organization || !user || !subscription) {
        return <Loader />;
    }

    const hasMemberCapablePlan = getHasMemberCapablePlan(organization, subscription);

    // Upsell
    if (!hasMemberCapablePlan) {
        return (
            <SettingsSectionWide>
                <SettingsParagraph>
                    {c('new_plans: info')
                        .t`${BRAND_NAME} lets you create email addresses and manage accounts for sub-users. Ideal for families and organizations.`}
                </SettingsParagraph>

                <UpgradeBanner
                    audience={Audience.B2B}
                    upsellPath={getUpsellRefFromApp({
                        app: APP_NAME,
                        feature: SHARED_UPSELL_PATHS.MULTI_USER,
                        component: UPSELL_COMPONENT.BANNER,
                        fromApp: app,
                    })}
                >{c('new_plans: upgrade')
                    .t`Included with multiple users ${BRAND_NAME} for Business plans.`}</UpgradeBanner>
            </SettingsSectionWide>
        );
    }

    if (organization.RequiresDomain && organization.UsedDomains === 0) {
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

    if (!organization.RequiresKey && !organization.Name) {
        const buttonCTA = hasFamily(subscription)
            ? c('familyOffer_2023:Action').t`Set up family group`
            : c('Action').t`Enable multi-user support`;

        return (
            <>
                <SettingsParagraph
                    learnMoreUrl={getKnowledgeBaseUrl(
                        isPartOfFamily ? '/get-started-proton-family' : '/proton-for-business'
                    )}
                >
                    {c('familyOffer_2023:Info')
                        .t`Create and manage family members and assign them storage space shared between ${DRIVE_APP_NAME} and ${MAIL_APP_NAME}.`}
                </SettingsParagraph>
                <PrimaryButton
                    onClick={async () => {
                        if (!hasMemberCapablePlan) {
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
                        createModal(<SetupOrganizationModal />);
                    }}
                >
                    {buttonCTA}
                </PrimaryButton>
            </>
        );
    }

    if (organization.RequiresKey && !organization.HasKeys) {
        return (
            <>
                <SettingsParagraph learnMoreUrl={getKnowledgeBaseUrl('/proton-for-business')}>
                    {c('Info').t`Create and manage sub-accounts and assign them email addresses on your custom domain.`}
                </SettingsParagraph>
                <PrimaryButton
                    loading={loading}
                    onClick={async () => {
                        if (!hasMemberCapablePlan) {
                            return createNotification({
                                type: 'error',
                                text: c('Error')
                                    .t`Please upgrade to a business plan with more than 1 user to get multi-user support`,
                            });
                        }

                        const run = async () => {
                            const { credentials } = await new Promise<{
                                credentials: Credentials;
                            }>((resolve, reject) => {
                                createModal(
                                    <AuthModal onCancel={reject} onSuccess={resolve} config={unlockPasswordChanges()} />
                                );
                            });

                            // VPN username only users might arrive here through the VPN business plan in protonvpn.com
                            if (user.isPrivate && !user.Keys.length) {
                                const [addresses, domains] = await Promise.all([
                                    getAddresses(),
                                    api<{
                                        Domains: string[];
                                    }>(queryAvailableDomains('signup')).then(({ Domains }) => Domains),
                                ]);
                                const preAuthKTVerifier = createPreAuthKTVerifier(ktActivation, api);
                                const passphrase = await handleSetupAddressKeys({
                                    addresses,
                                    api,
                                    username: user.Name,
                                    password: credentials.password,
                                    domains,
                                    preAuthKTVerify: preAuthKTVerifier.preAuthKTVerify,
                                });
                                await innerMutatePassword({
                                    api,
                                    authentication,
                                    keyPassword: passphrase,
                                    clearKeyPassword: credentials.password,
                                    User: user,
                                });
                                await preAuthKTVerifier.preAuthKTCommit(user.ID);
                            }

                            createModal(<SetupOrganizationModal />);
                        };

                        withLoading(run());
                    }}
                >{c('Action').t`Enable multi-user support`}</PrimaryButton>
            </>
        );
    }

    const organizationName = organization.Name;
    const inputLabel = isPartOfFamily ? c('familyOffer_2023:Label').t`Family name` : c('Label').t`Organization name`;

    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('Info').t`The name will be visible to your users while they are signed in.`}
            </SettingsParagraph>
            <Row>
                <Label htmlFor="organization-name-edit-button">{inputLabel}</Label>
                <Field className="pt-2 mb-2 md:mb-0">
                    <div className="text-bold text-ellipsis">{organizationName}</div>
                </Field>
                <div className="ml-0 md:ml-auto shrink-0">
                    <Button
                        id="organization-name-edit-button"
                        color="norm"
                        onClick={() => createModal(<OrganizationNameModal organization={organization} />)}
                    >{c('Action').t`Edit`}</Button>
                </div>
            </Row>
            {isPartOfFamily && (
                <Row>
                    <Button onClick={() => appLink('/mail/users-addresses', APPS.PROTONACCOUNT)}>{c(
                        'familyOffer_2023:Action'
                    ).t`Invite member to your family`}</Button>
                </Row>
            )}
        </SettingsSection>
    );
};

export default OrganizationSection;

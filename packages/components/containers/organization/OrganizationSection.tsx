import { c } from 'ttag';

import { Button, ButtonLike, InlineLinkButton } from '@proton/atoms';
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

import {
    ButtonGroup,
    Icon,
    Info,
    InputFieldTwo,
    Label,
    Loader,
    PrimaryButton,
    Row,
    SettingsLink,
    useAppLink,
    useModalState,
} from '../../components';
import {
    useApi,
    useAuthentication,
    useConfig,
    useCustomDomains,
    useGetAddresses,
    useModals,
    useNotifications,
    useSubscription,
    useUser,
} from '../../hooks';
import {
    SettingsLayout,
    SettingsLayoutLeft,
    SettingsLayoutRight,
    SettingsParagraph,
    SettingsSection,
    SettingsSectionWide,
    UpgradeBanner,
} from '../account';
import AuthModal from '../password/AuthModal';
import OrganizationNameModal from './OrganizationNameModal';
import SetupOrganizationModal from './SetupOrganizationModal';
import OrganizationLogoModal from './logoUpload/OrganizationLogoModal';
import OrganizationLogoRemovalModal from './logoUpload/OrganizationLogoRemovalModal';
import OrganizationLogoTipsModal from './logoUpload/OrganizationLogoTipsModal';
import { OrganizationLogoUploadUpsellBanner } from './logoUpload/OrganizationLogoUploadUpsellBanner';
import { useOrganizationTheme } from './logoUpload/useOrganizationTheme';

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
    const [customDomains] = useCustomDomains();
    const [subscription] = useSubscription();
    const appLink = useAppLink();
    const [loading, withLoading] = useLoading();
    const ktActivation = useKTActivation();
    const authentication = useAuthentication();

    const { createNotification } = useNotifications();
    const isPartOfFamily = hasFamily(subscription);

    const [organizationLogoModal, setOrganizationLogoModal, renderOrganizationLogoModal] = useModalState();
    const [organizationLogoTipsModal, setOrganizationLogoTipsModal, renderOrganizationLogoTipsModal] = useModalState();
    const [organizationLogoRemovalModal, setOrganizationLogoRemovalModal, renderOrganizationLogoRemovalModal] =
        useModalState();

    const organizationTheme = useOrganizationTheme();
    const canAccessLightLabelling = organizationTheme.access;

    if (!organization || !user || !subscription || !customDomains) {
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

    if (organization.RequiresDomain && customDomains.length === 0) {
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
                {canAccessLightLabelling ? (
                    <>
                        <p className="m-0">{c('Info')
                            .t`Add your name and logo to create a more personalized experience for your organization.`}</p>
                        <InlineLinkButton onClick={() => setOrganizationLogoTipsModal(true)}>{c(
                            'Organization logo upload'
                        ).t`Tips on choosing a good logo`}</InlineLinkButton>
                    </>
                ) : (
                    c('Info').t`The name will be visible to your users while they are signed in.`
                )}
            </SettingsParagraph>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <Label htmlFor="organization-name-edit-button" className="text-bold pt-0 mb-2 md:mb-0">
                        {inputLabel}
                    </Label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="w-full">
                    <div className="w-full flex flex-nowrap gap-2">
                        <InputFieldTwo readOnly className="md:mb-0" value={organizationName} />
                        <div className="shrink-0">
                            <Button
                                id="organization-name-edit-button"
                                color="norm"
                                onClick={() => createModal(<OrganizationNameModal organization={organization} />)}
                            >{c('Action').t`Edit`}</Button>
                        </div>
                    </div>
                </SettingsLayoutRight>
            </SettingsLayout>

            <OrganizationLogoUploadUpsellBanner
                organization={organization}
                canAccessLightLabelling={canAccessLightLabelling}
                isPartOfFamily={isPartOfFamily}
            />

            {canAccessLightLabelling && (
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <Label htmlFor="organization-logo-edit-button" className="text-bold mb-2 md:mb-0">
                            {c('Label').t`Logo`}{' '}
                            <Info
                                title={c('Tooltip')
                                    .t`Users will see your logo instead of the ${BRAND_NAME} icon when signed in on our web apps.`}
                                className="mb-1"
                            />
                        </Label>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight className="w-full">
                        {organizationTheme.logoURL ? (
                            <div className="flex items-center justify-start gap-2 border rounded-lg p-2 w-full">
                                <img
                                    src={organizationTheme.logoURL}
                                    alt=""
                                    className="w-custom h-custom border rounded bg-weak"
                                    style={{ '--w-custom': '5rem', '--h-custom': '5rem' }}
                                />
                                <ButtonGroup shape="ghost">
                                    <Button
                                        id="organization-logo-edit-button"
                                        onClick={() => setOrganizationLogoModal(true)}
                                    >
                                        <Icon name="pen" /> {c('Action').t`Change`}
                                    </Button>

                                    <Button
                                        id="organization-logo-remove-button"
                                        onClick={() => setOrganizationLogoRemovalModal(true)}
                                    >
                                        <Icon name="trash" /> {c('Action').t`Remove`}
                                    </Button>
                                </ButtonGroup>
                            </div>
                        ) : (
                            <Button
                                id="organization-logo-edit-button"
                                color="weak"
                                shape="outline"
                                onClick={() => setOrganizationLogoModal(true)}
                            >{c('Action').t`Upload`}</Button>
                        )}
                    </SettingsLayoutRight>
                    {renderOrganizationLogoModal && (
                        <OrganizationLogoModal
                            app={app}
                            size="large"
                            organization={organization}
                            {...organizationLogoModal}
                        />
                    )}
                    {renderOrganizationLogoRemovalModal && (
                        <OrganizationLogoRemovalModal
                            app={app}
                            size="small"
                            organization={organization}
                            {...organizationLogoRemovalModal}
                        />
                    )}
                    {renderOrganizationLogoTipsModal && (
                        <OrganizationLogoTipsModal
                            size="small"
                            onUploadClick={() => setOrganizationLogoModal(true)}
                            {...organizationLogoTipsModal}
                        />
                    )}
                </SettingsLayout>
            )}
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

import { c } from 'ttag';

import { Button, ButtonLike, CircleLoader, InlineLinkButton } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import useKTActivation from '@proton/components/containers/keyTransparency/useKTActivation';
import useLoading from '@proton/hooks/useLoading';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { unlockPasswordChanges } from '@proton/shared/lib/api/user';
import innerMutatePassword from '@proton/shared/lib/authentication/mutate';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, BRAND_NAME, DRIVE_APP_NAME, MAIL_APP_NAME, ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import { getHasMemberCapablePlan, hasDuo, hasFamily } from '@proton/shared/lib/helpers/subscription';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Organization } from '@proton/shared/lib/interfaces';
import { createPreAuthKTVerifier } from '@proton/shared/lib/keyTransparency';
import { handleSetupAddressKeys } from '@proton/shared/lib/keys';
import { getOrganizationDenomination } from '@proton/shared/lib/organization/helper';
import type { Credentials } from '@proton/shared/lib/srp';

import {
    ButtonGroup,
    Info,
    Label,
    Loader,
    PrimaryButton,
    Row,
    SettingsLink,
    Tooltip,
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
    useOrganizationKey,
    useSubscription,
    useUser,
} from '../../hooks';
import {
    SettingsLayout,
    SettingsLayoutLeft,
    SettingsLayoutRight,
    SettingsParagraph,
    SettingsSection,
} from '../account';
import DomainModal from '../domains/DomainModal';
import AuthModal from '../password/AuthModal';
import EditOrganizationIdentityModal from './EditOrganizationIdentityModal';
import OrganizationNameModal from './OrganizationNameModal';
import OrganizationSectionUpsell from './OrganizationSectionUpsell';
import SetupOrganizationModal from './SetupOrganizationModal';
import OrganizationLogoModal from './logoUpload/OrganizationLogoModal';
import OrganizationLogoRemovalModal from './logoUpload/OrganizationLogoRemovalModal';
import OrganizationLogoTipsModal from './logoUpload/OrganizationLogoTipsModal';
import { OrganizationLogoUploadUpsellBanner } from './logoUpload/OrganizationLogoUploadUpsellBanner';
import { useOrganizationTheme } from './logoUpload/useOrganizationTheme';
import useOrganizationIdentity from './useOrganizationIdentity';

interface Props {
    app: APP_NAMES;
    organization?: Organization;
}

const OrganizationSection = ({ app, organization }: Props) => {
    const { APP_NAME } = useConfig();
    const { createModal } = useModals();
    const [organizationKey] = useOrganizationKey();
    const [user] = useUser();
    const getAddresses = useGetAddresses();
    const api = useApi();
    const [customDomains] = useCustomDomains();
    const [subscription] = useSubscription();
    const [loading, withLoading] = useLoading();
    const ktActivation = useKTActivation();
    const authentication = useAuthentication();
    const [editOrganizationIdentityProps, setEditOrganizationIdentityModal, renderEditOrganizationIdentityModal] =
        useModalState();
    const [editOrganizationNameProps, setEditOrganizationNameModal, renderEditOrganizationNameModal] = useModalState();
    const [newDomainModalProps, setNewDomainModalOpen, renderNewDomain] = useModalState();

    const { createNotification } = useNotifications();
    const isPartOfFamily = getOrganizationDenomination(organization) === 'familyGroup';

    const [organizationLogoModal, setOrganizationLogoModal, renderOrganizationLogoModal] = useModalState();
    const [organizationLogoTipsModal, setOrganizationLogoTipsModal, renderOrganizationLogoTipsModal] = useModalState();
    const [organizationLogoRemovalModal, setOrganizationLogoRemovalModal, renderOrganizationLogoRemovalModal] =
        useModalState();

    const organizationTheme = useOrganizationTheme();
    const canAccessLightLabelling = organizationTheme.access && APP_NAME === APPS.PROTONACCOUNT;
    const organizationIdentity = useOrganizationIdentity();

    const isOrgActive = organization?.State === ORGANIZATION_STATE.ACTIVE;

    if (!organization || !user || !subscription || !customDomains) {
        return <Loader />;
    }

    const hasMemberCapablePlan = getHasMemberCapablePlan(organization, subscription);

    return (
        <>
            {renderNewDomain && <DomainModal {...newDomainModalProps} />}

            {renderOrganizationLogoModal && (
                <OrganizationLogoModal app={app} size="large" organization={organization} {...organizationLogoModal} />
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
            {renderEditOrganizationNameModal && (
                <OrganizationNameModal organization={organization} {...editOrganizationNameProps} />
            )}
            {renderEditOrganizationIdentityModal && (
                <EditOrganizationIdentityModal
                    signatureAddress={organizationIdentity.signatureAddress}
                    {...editOrganizationIdentityProps}
                />
            )}

            {(() => {
                if (!hasMemberCapablePlan || !isOrgActive) {
                    return <OrganizationSectionUpsell app={app} />;
                }

                if (organization.RequiresDomain && customDomains.length === 0) {
                    return (
                        <SettingsSection>
                            <SettingsParagraph>
                                {c('Info')
                                    .t`Create email addresses for other people, manage ${MAIL_APP_NAME} for a business, school, or group. Get started by adding your organization name and custom domain (e.g. @yourcompany.com). `}
                            </SettingsParagraph>
                            <ButtonLike
                                color="norm"
                                onClick={() => {
                                    setNewDomainModalOpen(true);
                                }}
                            >
                                {c('Action').t`Add domain`}
                            </ButtonLike>
                        </SettingsSection>
                    );
                }

                if (!organization.RequiresKey && !organization.Name) {
                    const buttonCTA = isPartOfFamily
                        ? c('familyOffer_2023:Action').t`Set up family group`
                        : c('Action').t`Enable multi-user support`;

                    let learnMoreLink = '/proton-for-business';
                    if (hasFamily(subscription)) {
                        learnMoreLink = '/get-started-proton-family';
                    } else if (hasDuo(subscription)) {
                        learnMoreLink = '/get-started-proton-duo';
                    }

                    return (
                        <>
                            <SettingsParagraph learnMoreUrl={getKnowledgeBaseUrl(learnMoreLink)}>
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
                                            <AuthModal
                                                onCancel={reject}
                                                onSuccess={resolve}
                                                config={unlockPasswordChanges()}
                                            />
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
                                {c('Info')
                                    .t`Create and manage sub-accounts and assign them email addresses on your custom domain.`}
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
                                                <AuthModal
                                                    onCancel={reject}
                                                    onSuccess={resolve}
                                                    config={unlockPasswordChanges()}
                                                />
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
                                                productParam: app,
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
                const inputLabel = isPartOfFamily
                    ? c('familyOffer_2023:Label').t`Family name`
                    : c('Label').t`Organization name`;
                const showOrganizationIdentity = Boolean(organizationKey?.privateKey);

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
                            <SettingsLayoutRight className="pt-2">
                                <div className="flex flex-nowrap gap-2">
                                    {organizationName && <div className="text-ellipsis">{organizationName}</div>}
                                    <InlineLinkButton
                                        id="organization-name-edit-button"
                                        onClick={() => {
                                            setEditOrganizationNameModal(true);
                                        }}
                                        aria-label={c('Action').t`Edit organization name`}
                                    >
                                        {c('Action').t`Edit`}
                                    </InlineLinkButton>
                                </div>
                            </SettingsLayoutRight>
                        </SettingsLayout>

                        {showOrganizationIdentity && (
                            <SettingsLayout>
                                <SettingsLayoutLeft>
                                    <Label
                                        htmlFor="organization-identity-edit-button"
                                        className="text-bold pt-0 mb-2 md:mb-0"
                                    >
                                        {c('orgidentity').t`Organization identity`}{' '}
                                        <Info
                                            title={c('Tooltip')
                                                .t`This email address will be shown to all organization members when performing account management operations.`}
                                            className="mb-1"
                                        />
                                    </Label>
                                </SettingsLayoutLeft>
                                <SettingsLayoutRight className="pt-2 w-full">
                                    <div className="w-full flex flex-nowrap gap-2">
                                        {organizationIdentity.signatureAddress && (
                                            <div className="flex flex-nowrap items-center">
                                                <div
                                                    className="text-ellipsis"
                                                    data-testid="organization-identity:address"
                                                >
                                                    {organizationIdentity.signatureAddress}
                                                </div>
                                                <div className="ml-0.5 shrink-0">
                                                    {organizationIdentity.state.result ? (
                                                        <Tooltip
                                                            openDelay={0}
                                                            title={organizationIdentity.state.result.label}
                                                        >
                                                            <Icon
                                                                data-testid="organization-identity:icon"
                                                                name={organizationIdentity.state.result.icon}
                                                                className={organizationIdentity.state.result.className}
                                                            />
                                                        </Tooltip>
                                                    ) : (
                                                        <CircleLoader />
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <InlineLinkButton
                                            id="organization-identity-edit-button"
                                            onClick={() => {
                                                setEditOrganizationIdentityModal(true);
                                            }}
                                            aria-label={c('orgidentity').t`Edit organization identity`}
                                        >
                                            {c('Action').t`Edit`}
                                        </InlineLinkButton>
                                    </div>
                                </SettingsLayoutRight>
                            </SettingsLayout>
                        )}

                        {app === APPS.PROTONACCOUNT && (
                            <OrganizationLogoUploadUpsellBanner
                                organization={organization}
                                canAccessLightLabelling={canAccessLightLabelling}
                                isPartOfFamily={isPartOfFamily}
                            />
                        )}

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
                            </SettingsLayout>
                        )}
                        {isPartOfFamily && (
                            <Row>
                                <ButtonLike as={SettingsLink} path="/users-addresses">
                                    {c('familyOffer_2023:Action').t`Invite member to your family`}
                                </ButtonLike>
                            </Row>
                        )}
                    </SettingsSection>
                );
            })()}
        </>
    );
};

export default OrganizationSection;

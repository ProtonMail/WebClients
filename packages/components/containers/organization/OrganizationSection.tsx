import { c } from 'ttag';

import { useOrganizationKey } from '@proton/account/organizationKey/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { ButtonGroup } from '@proton/components/components/button/ButtonGroup';
import Row from '@proton/components/components/container/Row';
import Icon from '@proton/components/components/icon/Icon';
import Label from '@proton/components/components/label/Label';
import Info from '@proton/components/components/link/Info';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import Loader from '@proton/components/components/loader/Loader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import useConfig from '@proton/components/hooks/useConfig';
import useSearchParamsEffect from '@proton/components/hooks/useSearchParamsEffect';
import { IcPen } from '@proton/icons/icons/IcPen';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import type { Organization } from '@proton/shared/lib/interfaces';
import { getOrganizationDenomination } from '@proton/shared/lib/organization/helper';

import EditOrganizationIdentityModal from './EditOrganizationIdentityModal';
import OrganizationNameModal from './OrganizationNameModal';
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
    const [organizationKey] = useOrganizationKey();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [editOrganizationIdentityProps, setEditOrganizationIdentityModal, renderEditOrganizationIdentityModal] =
        useModalState();
    const [editOrganizationNameProps, setEditOrganizationNameModal, renderEditOrganizationNameModal] = useModalState();

    const isPartOfFamily = getOrganizationDenomination(organization) === 'familyGroup';

    const [organizationLogoModal, setOrganizationLogoModal, renderOrganizationLogoModal] = useModalState();
    const [organizationLogoTipsModal, setOrganizationLogoTipsModal, renderOrganizationLogoTipsModal] = useModalState();
    const [organizationLogoRemovalModal, setOrganizationLogoRemovalModal, renderOrganizationLogoRemovalModal] =
        useModalState();

    const organizationTheme = useOrganizationTheme();
    const canAccessLightLabelling = organizationTheme.access && APP_NAME === APPS.PROTONACCOUNT;
    const organizationIdentity = useOrganizationIdentity();

    useSearchParamsEffect((params) => {
        const action = params.get('action');
        if (!action) {
            return;
        }
        if (action === 'set-organization-identity') {
            setEditOrganizationIdentityModal(true);
            params.delete('action');
            return params;
        }
    }, []);

    if (!organization || !user || !subscription) {
        return <Loader />;
    }

    const organizationName = organization.Name;
    const inputLabel = isPartOfFamily ? c('familyOffer_2023:Label').t`Family name` : c('Label').t`Organization name`;
    const showOrganizationIdentity = Boolean(organizationKey?.privateKey);

    return (
        <>
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
                            <Label htmlFor="organization-identity-edit-button" className="text-bold pt-0 mb-2 md:mb-0">
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
                                        <div className="text-ellipsis" data-testid="organization-identity:address">
                                            {organizationIdentity.signatureAddress}
                                        </div>
                                        <div className="inline-flex ml-0.5 shrink-0">
                                            {organizationIdentity.state.result ? (
                                                <Tooltip openDelay={0} title={organizationIdentity.state.result.label}>
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
                                            className="inline-flex items-center"
                                        >
                                            <IcPen className="mr-1" /> {c('Action').t`Change`}
                                        </Button>

                                        <Button
                                            id="organization-logo-remove-button"
                                            onClick={() => setOrganizationLogoRemovalModal(true)}
                                            className="inline-flex items-center"
                                        >
                                            <IcTrash className="mr-1" /> {c('Action').t`Remove`}
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
                            {c('familyOffer_2023:Action').t`Invite a user`}
                        </ButtonLike>
                    </Row>
                )}
            </SettingsSection>
        </>
    );
};

export default OrganizationSection;

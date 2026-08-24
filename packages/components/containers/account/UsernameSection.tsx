import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { selectSessionRecoveryData } from '@proton/account/recovery/sessionRecoverySelectors';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { DashboardCard, DashboardCardContent, DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Href } from '@proton/atoms/Href/Href';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import useLoading from '@proton/hooks/useLoading';
import { IcCardIdentity } from '@proton/icons/icons/IcCardIdentity';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { IcEnvelope } from '@proton/icons/icons/IcEnvelope';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { IcUserCircle } from '@proton/icons/icons/IcUserCircle';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import { postVerifySend } from '@proton/shared/lib/api/verify';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import {
    ADDRESS_TYPE,
    APPS,
    BRAND_NAME,
    CALENDAR_SHORT_APP_NAME,
    MAIL_APP_NAME,
    MAIL_SHORT_APP_NAME,
    SETUP_ADDRESS_PATH,
    SSO_PATHS,
} from '@proton/shared/lib/constants';
import { getIsAddressEnabled } from '@proton/shared/lib/helpers/address';
import { wait } from '@proton/shared/lib/helpers/promise';
import { stripLeadingAndTrailingSlash } from '@proton/shared/lib/helpers/string';
import type { Address } from '@proton/shared/lib/interfaces';
import { AddressConfirmationState, SessionRecoveryState, UserType } from '@proton/shared/lib/interfaces';
import { getCanSetupProtonAddress, getIsExternalAccount } from '@proton/shared/lib/keys';

import { Badge } from '../../components/badge/Badge';
import AppLink from '../../components/link/AppLink';
import Info from '../../components/link/Info';
import useModalState from '../../components/modalTwo/useModalState';
import { getVerificationSentText } from '../../containers/recovery/email/VerifyRecoveryEmailModal';
import getBoldFormattedText from '../../helpers/getBoldFormattedText';
import useApi from '../../hooks/useApi';
import useConfig from '../../hooks/useConfig';
import useNotifications from '../../hooks/useNotifications';
import useSearchParamsEffect from '../../hooks/useSearchParamsEffect';
import { PromotionBanner } from '../banner/PromotionBanner';
import EditDisplayNameModal from './EditDisplayNameModal';
import EditExternalAddressModal from './EditExternalAddressModal';
import { SettingsIconRow } from './SettingsIconRow';
import { SettingsValueRow } from './SettingsValueRow';
import mailCalendar from './mail-calendar.svg';
import PasswordResetAvailableCard from './sessionRecovery/statusCards/PasswordResetAvailableCard';
import SessionRecoveryInProgressCard from './sessionRecovery/statusCards/SessionRecoveryInProgressCard';
import unverified from './unverified.svg';

interface Props {
    app: APP_NAMES;
}

const UsernameSection = ({ app }: Props) => {
    const { APP_NAME } = useConfig();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const [user] = useUser();
    const location = useLocation();
    const [addresses, loadingAddresses] = useAddresses();
    const [tmpAddress, setTmpAddress] = useState<Address>();
    const [modalProps, setModalOpen, renderModal] = useModalState();
    const [editAddressModalProps, setEditAddressModalOpen, renderEditAddressModal] = useModalState();

    const { isSessionRecoveryAvailable, sessionRecoveryState } = useSelector(selectSessionRecoveryData);

    const primaryAddress = addresses?.find(getIsAddressEnabled);

    const BRAND_NAME_TWO = BRAND_NAME;

    const fromPath = `/${stripLeadingAndTrailingSlash(stripLocalBasenameFromPathname(location.pathname))}`;

    const handleSendVerificationEmail = async (destination: string) => {
        await wait(500);
        await api(
            postVerifySend({
                Type: 'external_email',
                Destination: destination,
            })
        );
        createNotification({
            type: 'success',
            text: getVerificationSentText(destination),
        });
    };

    const isPrimaryAddressExternal = primaryAddress?.Type === ADDRESS_TYPE.TYPE_EXTERNAL;
    const isExternalUser = getIsExternalAccount(user);
    const isExternalUserAndPrimaryAddressExternal = isExternalUser && isPrimaryAddressExternal;

    const isPrimaryAddressExternalAndVerified =
        isPrimaryAddressExternal &&
        primaryAddress?.ConfirmationState === AddressConfirmationState.CONFIRMATION_CONFIRMED;

    const canVerifyExternalAddress = isExternalUserAndPrimaryAddressExternal && !isPrimaryAddressExternalAndVerified;

    const canEditExternalAddress = canVerifyExternalAddress && (user.isPrivate || user.isAdmin);

    const canSetupProtonAddress = getCanSetupProtonAddress(user) && APP_NAME === APPS.PROTONACCOUNT;

    useSearchParamsEffect(
        (params) => {
            if (!canEditExternalAddress || !primaryAddress) {
                return;
            }
            const actionParam = params.get('action');
            if (!actionParam) {
                return;
            }

            if (actionParam === 'edit-email') {
                params.delete('action');
                setTmpAddress(primaryAddress);
                setEditAddressModalOpen(true);
                return params;
            }
        },
        [primaryAddress]
    );

    return (
        <>
            {renderModal && tmpAddress && <EditDisplayNameModal {...modalProps} address={tmpAddress} />}
            {renderEditAddressModal && tmpAddress && (
                <EditExternalAddressModal {...editAddressModalProps} address={tmpAddress} />
            )}
            <DashboardGrid>
                <DashboardGridSectionHeader
                    title={c('Title').t`User profile`}
                    subtitle={c('Info').t`Your profile and changes to it will be visible to other ${BRAND_NAME} users.`}
                />
                {isSessionRecoveryAvailable && sessionRecoveryState === SessionRecoveryState.GRACE_PERIOD && (
                    <SessionRecoveryInProgressCard />
                )}
                {isSessionRecoveryAvailable && sessionRecoveryState === SessionRecoveryState.INSECURE && (
                    <PasswordResetAvailableCard />
                )}
                {canSetupProtonAddress && (
                    <div>
                        <AppLink
                            toApp={APPS.PROTONACCOUNT}
                            to={`${SETUP_ADDRESS_PATH}?to=${APPS.PROTONMAIL}&from=${app}&from-type=settings&from-path=${fromPath}`}
                            className="text-no-decoration"
                            data-testid="get-proton-address"
                        >
                            <PromotionBanner
                                mode="banner"
                                rounded="xl"
                                contentCentered={false}
                                icon={<img width="40" src={mailCalendar} alt="" className="shrink-0" />}
                                description={getBoldFormattedText(
                                    c('Info')
                                        .t`**Get a ${BRAND_NAME} address** to use all ${BRAND_NAME_TWO} services including ${MAIL_SHORT_APP_NAME} and ${CALENDAR_SHORT_APP_NAME}.`
                                )}
                                cta={
                                    <div className="mr-4">
                                        <IcChevronRight size={4} className="rtl:mirror" />
                                    </div>
                                }
                            />
                        </AppLink>
                    </div>
                )}

                {canVerifyExternalAddress && (
                    <Card rounded bordered={true} background={false}>
                        <div className="h3 text-bold mb-6">{c('Info').t`Secure your ${BRAND_NAME} Account`}</div>
                        <div className="flex gap-4 flex-nowrap items-start">
                            <img className="shrink-0" width="40" height="40" src={unverified} alt="" />
                            <div>
                                <div className="mb-2 text-lg text-semibold flex">
                                    <div className="mr-2 text-ellipsis">{primaryAddress.Email}</div>
                                    <Badge type="warning">{c('Info').t`Unverified`}</Badge>
                                </div>
                                <div>
                                    <div className="mb-2">
                                        {c('Info').t`Increase your account security by verifying your email address.`}
                                    </div>
                                    <Button
                                        color="norm"
                                        loading={loading}
                                        onClick={() => {
                                            void withLoading(handleSendVerificationEmail(primaryAddress.Email));
                                        }}
                                    >
                                        {c('Info').t`Resend verification email`}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                <DashboardCard>
                    <DashboardCardContent>
                        <SettingsIconRow icon={IcUserCircle}>
                            <SettingsValueRow
                                label={
                                    <>
                                        <SettingsValueRow.Label>
                                            {c('Label').t`Username`}
                                            {canEditExternalAddress && (
                                                <Info
                                                    title={c('Info')
                                                        .t`You can edit this once to ensure the correct email address for verification.`}
                                                />
                                            )}
                                        </SettingsValueRow.Label>
                                        {isExternalUserAndPrimaryAddressExternal &&
                                            !isPrimaryAddressExternalAndVerified && (
                                                <SettingsValueRow.Description>
                                                    <span className="flex items-center flex-nowrap gap-1 color-danger">
                                                        <IcExclamationCircleFilled size={4} className="shrink-0" />
                                                        {c('Info').t`Unverified email address.`}
                                                    </span>
                                                </SettingsValueRow.Description>
                                            )}
                                    </>
                                }
                                value={
                                    isExternalUserAndPrimaryAddressExternal ? (
                                        <span className="flex items-center flex-nowrap gap-1">
                                            <span className="text-ellipsis user-select">{primaryAddress.Email}</span>
                                            {isPrimaryAddressExternalAndVerified && (
                                                <Tooltip title={c('Tooltip').t`Verified email address`} openDelay={0}>
                                                    <IcCheckmarkCircleFilled
                                                        size={4}
                                                        className="shrink-0 color-success"
                                                    />
                                                </Tooltip>
                                            )}
                                        </span>
                                    ) : (
                                        user.Name
                                    )
                                }
                                action={
                                    canEditExternalAddress && (
                                        <SettingsValueRow.EditButton
                                            title={c('Action').t`Edit email address`}
                                            aria-label={c('Action').t`Edit email address`}
                                            onClick={() => {
                                                setTmpAddress(primaryAddress);
                                                setEditAddressModalOpen(true);
                                            }}
                                        />
                                    )
                                }
                            />
                        </SettingsIconRow>
                        {(primaryAddress || loadingAddresses) && (
                            <>
                                <DashboardCardDivider />
                                <SettingsIconRow icon={IcCardIdentity}>
                                    <SettingsValueRow
                                        label={
                                            <SettingsValueRow.Label>
                                                {c('Label').t`Display name`}
                                            </SettingsValueRow.Label>
                                        }
                                        value={
                                            !primaryAddress || loadingAddresses ? (
                                                <CircleLoader />
                                            ) : (
                                                <span className="text-ellipsis user-select">
                                                    {primaryAddress.DisplayName}
                                                </span>
                                            )
                                        }
                                        action={
                                            primaryAddress &&
                                            !loadingAddresses && (
                                                <SettingsValueRow.EditButton
                                                    title={c('Action').t`Edit display name`}
                                                    aria-label={c('Action').t`Edit display name`}
                                                    onClick={() => {
                                                        setTmpAddress(primaryAddress);
                                                        setModalOpen(true);
                                                    }}
                                                />
                                            )
                                        }
                                    />
                                </SettingsIconRow>
                            </>
                        )}
                        {APP_NAME === APPS.PROTONVPN_SETTINGS && user.Type === UserType.PROTON && (
                            <>
                                <DashboardCardDivider />
                                <SettingsIconRow icon={IcEnvelope}>
                                    <SettingsValueRow
                                        label={
                                            <SettingsValueRow.Label>
                                                {c('Label').t`${MAIL_APP_NAME} address`}
                                            </SettingsValueRow.Label>
                                        }
                                        value={(() => {
                                            if (loadingAddresses) {
                                                return <CircleLoader />;
                                            }

                                            if (primaryAddress?.Email) {
                                                return (
                                                    <span className="text-ellipsis user-select">
                                                        {primaryAddress.Email}
                                                    </span>
                                                );
                                            }

                                            return (
                                                <Href
                                                    href={`${getAppHref(SSO_PATHS.SWITCH, APPS.PROTONACCOUNT)}?product=mail`}
                                                    title={c('Info')
                                                        .t`Sign in to ${MAIL_APP_NAME} to activate your address`}
                                                >
                                                    {c('Link').t`Not activated`}
                                                </Href>
                                            );
                                        })()}
                                    />
                                </SettingsIconRow>
                            </>
                        )}
                    </DashboardCardContent>
                </DashboardCard>
            </DashboardGrid>
        </>
    );
};

export default UsernameSection;

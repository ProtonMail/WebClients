import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button, Card, CircleLoader, Href, InlineLinkButton } from '@proton/atoms';
import Badge from '@proton/components/components/badge/Badge';
import Icon from '@proton/components/components/icon/Icon';
import AppLink from '@proton/components/components/link/AppLink';
import Info from '@proton/components/components/link/Info';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import { PromotionBanner } from '@proton/components/containers/banner/PromotionBanner';
import useLoading from '@proton/hooks/useLoading';
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
import clsx from '@proton/utils/clsx';

import { getVerificationSentText } from '../../containers/recovery/email/VerifyRecoveryEmailModal';
import getBoldFormattedText from '../../helpers/getBoldFormattedText';
import {
    useAddresses,
    useApi,
    useConfig,
    useIsSessionRecoveryAvailable,
    useNotifications,
    useSearchParamsEffect,
    useSessionRecoveryState,
    useUser,
} from '../../hooks';
import EditDisplayNameModal from './EditDisplayNameModal';
import EditExternalAddressModal from './EditExternalAddressModal';
import SettingsLayout from './SettingsLayout';
import SettingsLayoutLeft from './SettingsLayoutLeft';
import SettingsLayoutRight from './SettingsLayoutRight';
import SettingsSection from './SettingsSection';
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

    const [isSessionRecoveryAvailable] = useIsSessionRecoveryAvailable();
    const sessionRecoveryStatus = useSessionRecoveryState();

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

    const canEditExternalAddress =
        user.Type === UserType.EXTERNAL &&
        primaryAddress?.Type === ADDRESS_TYPE.TYPE_EXTERNAL &&
        primaryAddress.ConfirmationState === AddressConfirmationState.CONFIRMATION_NOT_CONFIRMED;

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
            <SettingsSection>
                {isSessionRecoveryAvailable && sessionRecoveryStatus === SessionRecoveryState.GRACE_PERIOD && (
                    <SessionRecoveryInProgressCard className="mb-6" />
                )}
                {isSessionRecoveryAvailable && sessionRecoveryStatus === SessionRecoveryState.INSECURE && (
                    <PasswordResetAvailableCard className="mb-6" />
                )}
                {user.Type === UserType.EXTERNAL &&
                    primaryAddress?.Type === ADDRESS_TYPE.TYPE_EXTERNAL &&
                    APP_NAME === APPS.PROTONACCOUNT && (
                        <div className="mb-6">
                            <AppLink
                                toApp={APPS.PROTONACCOUNT}
                                to={`${SETUP_ADDRESS_PATH}?to=${APPS.PROTONMAIL}&from=${app}&from-type=settings&from-path=${fromPath}`}
                                className="text-no-decoration"
                                data-testid="get-proton-address"
                            >
                                <PromotionBanner
                                    mode="banner"
                                    rounded
                                    contentCentered={false}
                                    icon={<img width="40" src={mailCalendar} alt="" className="shrink-0" />}
                                    description={getBoldFormattedText(
                                        c('Info')
                                            .t`**Get a ${BRAND_NAME} address** to use all ${BRAND_NAME_TWO} services including ${MAIL_SHORT_APP_NAME} and ${CALENDAR_SHORT_APP_NAME}.`
                                    )}
                                    cta={
                                        <div className="mr-4">
                                            <Icon name="chevron-right" size={4} />
                                        </div>
                                    }
                                />
                            </AppLink>
                        </div>
                    )}

                {canEditExternalAddress && (
                    <Card className="mb-8" rounded bordered={true} background={false}>
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
                                            withLoading(handleSendVerificationEmail(primaryAddress.Email));
                                        }}
                                    >
                                        {c('Info').t`Resend verification email`}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <div className="text-semibold">{c('Label').t`Username`}</div>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight className="pt-2">
                        {user.Type === UserType.EXTERNAL && primaryAddress?.Type === ADDRESS_TYPE.TYPE_EXTERNAL ? (
                            <div>
                                {primaryAddress.ConfirmationState ===
                                AddressConfirmationState.CONFIRMATION_CONFIRMED ? (
                                    <div className="flex">
                                        {primaryAddress.Email}
                                        <Tooltip title={c('Tooltip').t`Verified email address`} openDelay={0}>
                                            <Icon
                                                name="checkmark-circle-filled"
                                                size={4}
                                                className="ml-2 color-success self-center"
                                            />
                                        </Tooltip>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex">
                                            {!canEditExternalAddress ? (
                                                primaryAddress.Email
                                            ) : (
                                                <>
                                                    <span className="mr-2">{primaryAddress.Email}</span>
                                                    <InlineLinkButton
                                                        className="mr-1"
                                                        onClick={() => {
                                                            setTmpAddress(primaryAddress);
                                                            setEditAddressModalOpen(true);
                                                        }}
                                                        aria-label={c('Action').t`Edit email address`}
                                                    >
                                                        {c('Action').t`Edit`}
                                                    </InlineLinkButton>
                                                    <Info
                                                        className="self-center"
                                                        title={c('Info')
                                                            .t`You can edit this once to ensure the correct email address for verification.`}
                                                    />
                                                </>
                                            )}
                                        </div>
                                        <div className="flex">
                                            <Icon
                                                name="exclamation-circle-filled"
                                                size={4}
                                                className="mr-1 color-danger self-center"
                                            />
                                            <span className="color-weak mr-1">
                                                {c('Info').t`Unverified email address.`}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            user.Name
                        )}
                    </SettingsLayoutRight>
                </SettingsLayout>
                {(primaryAddress || loadingAddresses) && (
                    <SettingsLayout>
                        <SettingsLayoutLeft>
                            <div className="text-semibold">{c('Label').t`Display name`}</div>
                        </SettingsLayoutLeft>
                        <SettingsLayoutRight className="pt-2">
                            {!primaryAddress || loadingAddresses ? (
                                <div className="flex flex-nowrap">
                                    <CircleLoader />
                                </div>
                            ) : (
                                <div className="flex flex-nowrap">
                                    <div
                                        className={clsx(
                                            'text-ellipsis user-select',
                                            primaryAddress.DisplayName && 'mr-2'
                                        )}
                                    >
                                        {primaryAddress.DisplayName}
                                    </div>
                                    <InlineLinkButton
                                        onClick={() => {
                                            setTmpAddress(primaryAddress);
                                            setModalOpen(true);
                                        }}
                                        aria-label={c('Action').t`Edit display name`}
                                    >
                                        {c('Action').t`Edit`}
                                    </InlineLinkButton>
                                </div>
                            )}
                        </SettingsLayoutRight>
                    </SettingsLayout>
                )}
                {APP_NAME === APPS.PROTONVPN_SETTINGS && user.Type === UserType.PROTON && (
                    <SettingsLayout>
                        <SettingsLayoutLeft>
                            <div className="text-semibold">{c('Label').t`${MAIL_APP_NAME} address`}</div>
                        </SettingsLayoutLeft>
                        <SettingsLayoutRight className="pt-2">
                            {(() => {
                                if (loadingAddresses) {
                                    return (
                                        <div className="flex flex-nowrap">
                                            <CircleLoader />
                                        </div>
                                    );
                                }

                                if (primaryAddress?.Email) {
                                    return (
                                        <div className="text-pre-wrap break user-select">{primaryAddress.Email}</div>
                                    );
                                }

                                return (
                                    <Href
                                        href={`${getAppHref(SSO_PATHS.SWITCH, APPS.PROTONACCOUNT)}?product=mail`}
                                        title={c('Info').t`Sign in to ${MAIL_APP_NAME} to activate your address`}
                                    >
                                        {c('Link').t`Not activated`}
                                    </Href>
                                );
                            })()}
                        </SettingsLayoutRight>
                    </SettingsLayout>
                )}
            </SettingsSection>
        </>
    );
};

export default UsernameSection;

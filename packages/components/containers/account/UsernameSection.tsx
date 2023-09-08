import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button, Card, CircleLoader, Href } from '@proton/atoms';
import { getVerificationSentText } from '@proton/components/containers/recovery/email/VerifyRecoveryEmailModal';
import useLoading from '@proton/hooks/useLoading';
import { postVerifySend } from '@proton/shared/lib/api/verify';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import {
    APPS,
    APP_NAMES,
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
import { Address, AddressConfirmationState, UserType } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { AppLink, Badge, Icon, Info, InlineLinkButton, Tooltip, useModalState } from '../../components';
import { useAddresses, useApi, useConfig, useNotifications, useUser } from '../../hooks';
import EditAddressModal from './EditAddressModal';
import EditDisplayNameModal from './EditDisplayNameModal';
import SettingsLayout from './SettingsLayout';
import SettingsLayoutLeft from './SettingsLayoutLeft';
import SettingsLayoutRight from './SettingsLayoutRight';
import SettingsSection from './SettingsSection';
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

    const primaryAddress = addresses?.find(getIsAddressEnabled);

    const BRAND_NAME_TWO = BRAND_NAME;

    const fromPath = `/${stripLeadingAndTrailingSlash(stripLocalBasenameFromPathname(location.pathname))}`;

    const handleSendVerificationEmail = async () => {
        if (!primaryAddress) {
            throw new Error('Missing primary address');
        }
        await wait(500);
        const destination = primaryAddress.Email;
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

    return (
        <>
            {renderModal && tmpAddress && <EditDisplayNameModal {...modalProps} address={tmpAddress} />}
            {renderEditAddressModal && tmpAddress && (
                <EditAddressModal {...editAddressModalProps} address={tmpAddress} />
            )}
            <SettingsSection>
                {user.Type === UserType.EXTERNAL && primaryAddress && APP_NAME === APPS.PROTONACCOUNT && (
                    <>
                        <Card className="mb-8" rounded bordered={false}>
                            <div className="mb-2">
                                {c('Info')
                                    .t`Get a ${BRAND_NAME} address to use all ${BRAND_NAME_TWO} services including ${MAIL_SHORT_APP_NAME} and ${CALENDAR_SHORT_APP_NAME}.`}{' '}
                                <Href href={getKnowledgeBaseUrl('/external-accounts')}>{c('Link').t`Learn more`}</Href>
                            </div>
                            <ButtonLike
                                as={AppLink}
                                toApp={APPS.PROTONACCOUNT}
                                to={`${SETUP_ADDRESS_PATH}?to=${APPS.PROTONMAIL}&from=${app}&from-type=settings&from-path=${fromPath}`}
                                color="norm"
                            >
                                {c('Info').t`Get my ${BRAND_NAME} address`}
                            </ButtonLike>
                        </Card>
                        {primaryAddress.ConfirmationState !== AddressConfirmationState.CONFIRMATION_CONFIRMED && (
                            <Card className="mb-8" rounded bordered={true} background={false}>
                                <div className="h3 text-bold mb-6">{c('Info')
                                    .t`Secure your ${BRAND_NAME} Account`}</div>
                                <div className="flex gap-4 flex-nowrap flex-align-items-start">
                                    <img
                                        className="flex-item-noshrink"
                                        width="40"
                                        height="40"
                                        src={unverified}
                                        alt=""
                                    />
                                    <div>
                                        <div className="mb-2 text-lg text-semibold">
                                            <span className="mr-2">{primaryAddress.Email}</span>
                                            <Badge type="warning">{c('Info').t`Unverified`}</Badge>
                                        </div>
                                        <div>
                                            <div className="mb-2">
                                                {c('Info')
                                                    .t`Increase your account security by verifying your email address.`}
                                            </div>
                                            <Button
                                                color="norm"
                                                loading={loading}
                                                onClick={() => {
                                                    withLoading(handleSendVerificationEmail());
                                                }}
                                            >
                                                {c('Info').t`Resend verification email`}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </>
                )}
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <div className="text-semibold">{c('Label').t`Username`}</div>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight className="pt-2">
                        {user.Type === UserType.EXTERNAL && primaryAddress ? (
                            <div>
                                <div>
                                    {primaryAddress.ConfirmationState ===
                                    AddressConfirmationState.CONFIRMATION_CONFIRMED ? (
                                        <>
                                            <div className="flex">
                                                {primaryAddress.Email}
                                                <Tooltip title={c('Tooltip').t`Verified email address`} openDelay={0}>
                                                    <Icon
                                                        name="checkmark-circle-filled"
                                                        size={16}
                                                        className="ml-2 color-success flex-align-self-center"
                                                    />
                                                </Tooltip>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex">
                                                <span className="mr-2">{primaryAddress.Email} </span>
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
                                                    className="flex-align-self-center"
                                                    title={c('Info')
                                                        .t`You can edit this once to ensure the correct email address for verification.`}
                                                />
                                            </div>
                                            <div className="flex">
                                                <Icon
                                                    name="exclamation-circle-filled"
                                                    size={16}
                                                    className="mr-1 color-danger flex-align-self-center"
                                                />
                                                <span className="color-weak mr-1">
                                                    {c('Info').t`Unverified email address.`}
                                                </span>
                                                <InlineLinkButton
                                                    className="flex flex-no-wrap gap-1"
                                                    onClick={() => {
                                                        withLoading(handleSendVerificationEmail());
                                                    }}
                                                    aria-label={c('Action').t`Verify email address`}
                                                >
                                                    {c('Action').t`Verify now`}
                                                    {loading && <CircleLoader className="flex-align-self-center" />}
                                                </InlineLinkButton>
                                            </div>
                                        </>
                                    )}
                                </div>
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
                            {loadingAddresses ? (
                                <div className="flex flex-nowrap">
                                    <CircleLoader />
                                </div>
                            ) : primaryAddress?.Email ? (
                                <div className="text-pre-wrap break user-select">{primaryAddress.Email}</div>
                            ) : (
                                <Href
                                    href={`${getAppHref(SSO_PATHS.SWITCH, APPS.PROTONACCOUNT)}?product=mail`}
                                    title={c('Info').t`Sign in to ${MAIL_APP_NAME} to activate your address`}
                                >
                                    {c('Link').t`Not activated`}
                                </Href>
                            )}
                        </SettingsLayoutRight>
                    </SettingsLayout>
                )}
            </SettingsSection>
        </>
    );
};

export default UsernameSection;

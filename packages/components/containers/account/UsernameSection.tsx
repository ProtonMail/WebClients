import { useState } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import {
    APPS,
    APP_NAMES,
    BRAND_NAME,
    MAIL_APP_NAME,
    SETUP_ADDRESS_PATH,
    SSO_PATHS,
} from '@proton/shared/lib/constants';
import { getIsAddressEnabled } from '@proton/shared/lib/helpers/address';
import { Address, UserType } from '@proton/shared/lib/interfaces';

import { AppLink, Href, InlineLinkButton, useModalState } from '../../components';
import { useAddresses, useUser } from '../../hooks';
import EditDisplayNameModal from './EditDisplayNameModal';
import SettingsLayout from './SettingsLayout';
import SettingsLayoutLeft from './SettingsLayoutLeft';
import SettingsLayoutRight from './SettingsLayoutRight';
import SettingsSection from './SettingsSection';

interface Props {
    app: APP_NAMES;
}

const UsernameSection = ({ app }: Props) => {
    const [user] = useUser();
    const [addresses, loadingAddresses] = useAddresses();
    const [tmpAddress, setTmpAddress] = useState<Address>();
    const [modalProps, setModalOpen, renderModal] = useModalState();

    const primaryAddress = addresses?.find(getIsAddressEnabled);

    return (
        <>
            {renderModal && tmpAddress && <EditDisplayNameModal {...modalProps} address={tmpAddress} />}
            <SettingsSection>
                {user.Type === UserType.EXTERNAL && primaryAddress && (
                    <Card className="mb2" rounded bordered={false}>
                        <div className="mb1">
                            {c('Info')
                                .t`Get a ${BRAND_NAME} address to use all ${BRAND_NAME} services including Mail and Calendar.`}
                        </div>
                        <ButtonLike
                            as={AppLink}
                            toApp={APPS.PROTONACCOUNT}
                            to={`${SETUP_ADDRESS_PATH}?to=${APPS.PROTONMAIL}&from=${app}`}
                        >
                            {c('Info').t`Get my ${BRAND_NAME} address`}
                        </ButtonLike>
                    </Card>
                )}
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <div className="text-semibold">
                            {primaryAddress ? c('Label').t`Display name` : c('Label').t`Name`}
                        </div>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight className="pt0-5">
                        {loadingAddresses ? (
                            <div className="flex flex-nowrap">
                                <CircleLoader />
                            </div>
                        ) : (
                            <div className="flex flex-nowrap">
                                <div className="text-ellipsis user-select mr0-5">
                                    {primaryAddress ? primaryAddress.DisplayName : user.Name}
                                </div>
                                {primaryAddress && (
                                    <InlineLinkButton
                                        onClick={() => {
                                            setTmpAddress(primaryAddress);
                                            setModalOpen(true);
                                        }}
                                    >
                                        {c('Action').t`Edit`}
                                    </InlineLinkButton>
                                )}
                            </div>
                        )}
                    </SettingsLayoutRight>
                </SettingsLayout>
                {app === APPS.PROTONVPN_SETTINGS && user.Type === UserType.PROTON && (
                    <SettingsLayout>
                        <SettingsLayoutLeft>
                            <div className="text-semibold">{c('Label').t`${MAIL_APP_NAME} address`}</div>
                        </SettingsLayoutLeft>
                        <SettingsLayoutRight>
                            {loadingAddresses ? (
                                <div className="flex flex-nowrap">
                                    <CircleLoader />
                                </div>
                            ) : primaryAddress?.Email ? (
                                <div className="text-pre-wrap break user-select">{primaryAddress.Email}</div>
                            ) : (
                                <Href
                                    url={`${getAppHref(SSO_PATHS.SWITCH, APPS.PROTONACCOUNT)}?product=mail`}
                                    title={c('Info').t`Log in to ${MAIL_APP_NAME} to activate your address`}
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

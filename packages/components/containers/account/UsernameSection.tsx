import { useState } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';
import { APPS, APP_NAMES, BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
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
    const [{ Name, Email, Type, DisplayName }] = useUser();
    const [addresses] = useAddresses();
    const [tmpAddress, setTmpAddress] = useState<Address>();
    const [modalProps, setModalOpen, renderModal] = useModalState();

    const primaryAddress = addresses?.find(getIsAddressEnabled);

    return (
        <>
            {renderModal && tmpAddress && <EditDisplayNameModal {...modalProps} address={tmpAddress} />}
            <SettingsSection>
                {Type === UserType.EXTERNAL && primaryAddress && (
                    <Card className="mb2" rounded bordered={false}>
                        <div className="mb1">
                            {c('Info')
                                .t`Get a ${BRAND_NAME} address to use all ${BRAND_NAME} services including Mail and Calendar.`}
                        </div>
                        <ButtonLike
                            as={AppLink}
                            toApp={APPS.PROTONACCOUNT}
                            to={`/setup-internal-address?to=${APPS.PROTONMAIL}&from=${app}`}
                        >
                            {c('Info').t`Get my ${BRAND_NAME} address`}
                        </ButtonLike>
                    </Card>
                )}
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <div className="text-semibold">{Name ? c('Label').t`Name` : c('Label').t`Username`}</div>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight className="pt0-5">
                        {app === APPS.PROTONVPN_SETTINGS ? (
                            <Href
                                url="https://account.proton.me/switch?product=mail"
                                title={c('Info').t`Log in to ${MAIL_APP_NAME} to activate your address`}
                            >
                                {c('Link').t`Not activated`}
                            </Href>
                        ) : (
                            <div className="text-pre-wrap break user-select">{Name ? Name : Email}</div>
                        )}
                    </SettingsLayoutRight>
                </SettingsLayout>
                {Type === UserType.EXTERNAL && primaryAddress && (
                    <SettingsLayout>
                        <SettingsLayoutLeft>
                            <div className="text-semibold">{c('Label').t`Display name`}</div>
                        </SettingsLayoutLeft>
                        <SettingsLayoutRight className="pt0-5">
                            <div className="flex flex-nowrap">
                                <div className="text-ellipsis user-select mr0-5">{DisplayName}</div>
                                <InlineLinkButton
                                    onClick={() => {
                                        setTmpAddress(primaryAddress);
                                        setModalOpen(true);
                                    }}
                                >{c('Action').t`Edit`}</InlineLinkButton>
                            </div>
                        </SettingsLayoutRight>
                    </SettingsLayout>
                )}
            </SettingsSection>
        </>
    );
};

export default UsernameSection;

import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    DropdownMenu,
    DropdownMenuButton,
    FeatureCode,
    Icon,
    SimpleDropdown,
    useFeatures,
    useModalState,
} from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getParsedHeadersFirstValue } from '@proton/shared/lib/mail/messages';

import { MessageState } from '../../../logic/messages/messagesTypes';
import ItemSpyTrackerIcon from '../../list/spy-tracker/ItemSpyTrackerIcon';
import SpyTrackerModal from '../../list/spy-tracker/SpyTrackerModal';
import SimpleLoginModal from '../../simpleLogin/SimpleLoginModal';

interface Props {
    message: MessageState;
}

const HeaderTopPrivacyIcon = ({ message }: Props) => {
    const [
        { feature: spyTrackerFeature, loading: loadingSpyTrackerFeature },
        // On the first part of the SL integration we will not have the change on the icon. We already started the implementation so we will hide it for now
        //{ feature: simpleLoginIntegrationFeature, loading: loadingSimpleLoginIntegrationFeature }, // TODO uncomment later
    ] = useFeatures([FeatureCode.SpyTrackerProtection, FeatureCode.SLIntegration]);

    const isSimpleLoginIntegration = false; // TODO replace with when we will need itsimpleLoginIntegrationFeature?.Value;

    const [simpleLoginModalProps, setSimpleLoginModalOpen, renderSimpleLoginModal] = useModalState();
    const [spyTrackerModalProps, setSpyTrackerModalOpen, renderSpyTrackerModal] = useModalState();

    const isSimpleLoginAlias = getParsedHeadersFirstValue(message.data, 'X-Simplelogin-Type') === 'Forward';

    if (loadingSpyTrackerFeature) {
        // TODO check also loadingSimpleLoginIntegrationFeature
        return null;
    }

    const itemSpyTrackerIcon = (
        <ItemSpyTrackerIcon
            message={message}
            onClickIcon={isSimpleLoginIntegration ? undefined : () => setSpyTrackerModalOpen(true)}
        />
    );

    return (
        <span className="absolute message-header-security-icons flex flex-row flex-nowrap">
            {spyTrackerFeature?.Value && !isSimpleLoginIntegration && itemSpyTrackerIcon}
            {spyTrackerFeature?.Value && isSimpleLoginIntegration && (
                <SimpleDropdown
                    as={Button}
                    size="small"
                    color="weak"
                    shape="outline"
                    pill
                    content={<Icon name="envelope-lock" className="color-primary" />}
                    hasCaret={false}
                    className="pt0 pr0-75 pl0-75"
                >
                    <DropdownMenu>
                        <DropdownMenuButton className="text-left" onClick={() => setSpyTrackerModalOpen(true)}>
                            {itemSpyTrackerIcon}
                        </DropdownMenuButton>
                        {isSimpleLoginAlias && (
                            <DropdownMenuButton className="text-left" onClick={() => setSimpleLoginModalOpen(true)}>
                                <div className="flex flex-nowrap flex-align-items-center">
                                    <Icon
                                        name="brand-simple-login"
                                        className="mr0-5 relative inline-flex flex-align-items-center"
                                        color="#D42C83"
                                        alt={c('Alternative text for simple login image').t`Simple Login`}
                                    />
                                    <span className="pl0-25 flex-item-fluid">
                                        {
                                            // translator : Received message has been delivered to the user via a Simple Login alias
                                            c('Message has been sent to the user via a SimpleLogin alias')
                                                .t`Delivered via SimpleLogin by ${BRAND_NAME}`
                                        }
                                    </span>
                                </div>
                            </DropdownMenuButton>
                        )}
                    </DropdownMenu>
                </SimpleDropdown>
            )}
            {renderSpyTrackerModal && <SpyTrackerModal message={message} {...spyTrackerModalProps} />}
            {renderSimpleLoginModal && <SimpleLoginModal {...simpleLoginModalProps} />}
        </span>
    );
};

export default HeaderTopPrivacyIcon;

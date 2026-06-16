import { useContext } from 'react';

import { c } from 'ttag';

import { NotificationDot } from '@proton/atoms/NotificationDot/NotificationDot';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { ThemeColor } from '@proton/colors/types';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { SchedulePhoneCall } from '@proton/components/containers/heading/SchedulePhoneCall';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getShopURL } from '@proton/shared/lib/helpers/url';
import { useFlag } from '@proton/unleash/useFlag';

import { UserDropdownContext } from './UserDropdownContext';

export const UserDropdownFooter = () => {
    const { onOpenHelpModal, onOpenChat, closeUserDropdown, referral } = useContext(UserDropdownContext);
    const isZendeskAIAgentEnabled = useFlag('EnableZenDeskAIAgent');

    return (
        <div className="text-sm text-center flex flex-column gap-2">
            <div className="block">
                <button
                    type="button"
                    className="px-1 link link-focus color-weak text-no-decoration hover:color-norm"
                    onClick={() => onOpenHelpModal()}
                    data-testid="userdropdown:help:button:help-and-feedback"
                >
                    {c('Action').t`Help and feedback`}
                </button>
            </div>

            <SchedulePhoneCall />

            {onOpenChat && (
                <div className="block">
                    <Tooltip
                        title={
                            isZendeskAIAgentEnabled ? c('Tooltip').t`Instant AI assistance, human expert on hand!` : ''
                        }
                    >
                        <button
                            type="button"
                            className="mx-auto w-full px-2 link link-focus color-weak text-no-decoration hover:color-norm"
                            onClick={() => {
                                closeUserDropdown();
                                onOpenChat();
                            }}
                        >
                            {c('Action').t`Chat with us`}
                            {isZendeskAIAgentEnabled && <IcInfoCircle className="ml-2 color-primary" />}
                        </button>
                    </Tooltip>
                </div>
            )}

            <div className="flex justify-center">
                {referral.visible && (
                    <>
                        <SettingsLink
                            className="px-2 link link-focus color-weak text-no-decoration hover:color-norm"
                            path="/referral"
                            onClick={closeUserDropdown}
                            data-testid="userdropdown:button:referral"
                        >
                            {c('Action').t`Refer a friend`}
                            {referral.redDotReferral ? <NotificationDot color={ThemeColor.Danger} /> : <span />}
                        </SettingsLink>
                        <span className="self-center color-weak" aria-hidden="true">
                            •
                        </span>
                    </>
                )}
                <a
                    className="px-2 link link-focus color-weak text-no-decoration hover:color-norm"
                    href={getShopURL()}
                    target="_blank"
                    data-testid="userdropdown:link:shop"
                >
                    {c('Action').t`${BRAND_NAME} shop`}
                </a>
            </div>
        </div>
    );
};

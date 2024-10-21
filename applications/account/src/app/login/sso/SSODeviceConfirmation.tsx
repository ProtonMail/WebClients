import { useEffect } from 'react';

import { c } from 'ttag';

import AuthDeviceItem from '@proton/account/sso/AuthDeviceItem';
import { Button, Scroll } from '@proton/atoms';
import type { AuthCacheResult } from '@proton/components/containers/login/interface';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';

import Text from '../../public/Text';
import SSOConfirmationCode from './SSOConfirmationCode';

interface Props {
    ssoData: AuthCacheResult['data']['ssoData'];
    onUseBackupPassword?: () => void;
    onAskAdminHelp?: () => void;
}

const SSODeviceConfirmation = ({ ssoData, onAskAdminHelp, onUseBackupPassword }: Props) => {
    const authDevices = ssoData?.authDevices || [];

    useEffect(() => {
        if (!ssoData || (ssoData.type !== 'unlock' && ssoData.type !== 'inactive')) {
            return;
        }
        const stopPolling = ssoData.poll.start();
        return () => {
            stopPolling();
        };
    }, []);

    const email = (() => {
        if (!ssoData || (ssoData.type !== 'unlock' && ssoData.type !== 'inactive')) {
            return '';
        }
        return ssoData.address.Email;
    })();

    return (
        <div>
            <Text>
                {getBoldFormattedText(
                    c('sso')
                        .t`To make sure it's really you trying to sign in to **${email}**, review the confirmation code and approve the request from another device.`
                )}
            </Text>
            <SSOConfirmationCode ssoData={ssoData} />
            {authDevices.length > 0 && (
                <div className="mt-4 flex overflow-hidden">
                    <div>{c('sso').t`Devices available`}</div>
                    <div className="w-full max-h-custom" style={{ '--max-h-custom': '10em' }}>
                        <Scroll>
                            <div className="rounded border border-weak flex flex-column divide-y divide-weak">
                                {authDevices.map((authDevice) => (
                                    <AuthDeviceItem key={authDevice.ID} authDevice={authDevice} />
                                ))}
                            </div>
                        </Scroll>
                    </div>
                </div>
            )}
            {onUseBackupPassword && (
                <Button
                    size="large"
                    shape="outline"
                    color="weak"
                    type="button"
                    fullWidth
                    className="mt-6"
                    onClick={onUseBackupPassword}
                >
                    {c('sso').t`Use backup password instead`}
                </Button>
            )}
            {onAskAdminHelp && (
                <Button
                    size="large"
                    shape="ghost"
                    color="norm"
                    type="button"
                    fullWidth
                    className="mt-2"
                    onClick={onAskAdminHelp}
                >
                    {c('sso').t`Ask administrator for help`}
                </Button>
            )}
        </div>
    );
};

export default SSODeviceConfirmation;

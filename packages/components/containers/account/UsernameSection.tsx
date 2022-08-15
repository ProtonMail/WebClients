import { c } from 'ttag';

import { APPS, MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { Href } from '../../components';
import { useConfig, useUser } from '../../hooks';
import SettingsLayout from './SettingsLayout';
import SettingsLayoutLeft from './SettingsLayoutLeft';
import SettingsLayoutRight from './SettingsLayoutRight';
import SettingsSection from './SettingsSection';

const UsernameSection = () => {
    const { APP_NAME } = useConfig();
    const [{ Name, Email }] = useUser();

    if (APP_NAME === APPS.PROTONVPN_SETTINGS) {
        return (
            <SettingsSection>
                {Name ? (
                    <SettingsLayout>
                        <SettingsLayoutLeft>
                            <div className="text-semibold">{c('Label').t`Name`}</div>
                        </SettingsLayoutLeft>
                        <SettingsLayoutRight>
                            <div className="text-pre-wrap break user-select">{Name}</div>
                        </SettingsLayoutRight>
                    </SettingsLayout>
                ) : null}
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <div className="text-semibold">{c('Label').t`${MAIL_APP_NAME} address`}</div>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight>
                        {Email ? (
                            <div className="text-pre-wrap break user-select">{Email}</div>
                        ) : (
                            <Href
                                url="https://account.proton.me/switch?product=mail"
                                title={c('Info').t`Log in to ${MAIL_APP_NAME} to activate your address`}
                            >{c('Link').t`Not activated`}</Href>
                        )}
                    </SettingsLayoutRight>
                </SettingsLayout>
            </SettingsSection>
        );
    }

    return (
        <SettingsSection>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <div className="text-semibold">{Name ? c('Label').t`Name` : c('Label').t`Email address`}</div>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <div className="text-pre-wrap break user-select">{Name ? Name : Email}</div>
                </SettingsLayoutRight>
            </SettingsLayout>
        </SettingsSection>
    );
};

export default UsernameSection;

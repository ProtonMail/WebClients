import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { useFlag } from '@proton/unleash/useFlag';

import BetaBadge from '../../components/badge/BetaBadge';
import { SettingsCardRows } from '../account/SettingsCardRows';
import { SettingsToggleRow } from '../account/SettingsToggleRow';
import KTToggle from './KTToggle';
import PromptPinToggle from './PromptPinToggle';

export const AddressVerificationSection = () => {
    const showKTSetting = useFlag('KeyTransparencyShowUI');
    return (
        <SettingsCardRows>
            <SettingsToggleRow
                id="prompt-pin-toggle"
                label={
                    <>
                        <SettingsToggleRow.Label>{c('Label').t`Prompt to trust keys`}</SettingsToggleRow.Label>
                        <SettingsToggleRow.Description>
                            {c('Tooltip prompt to trust keys')
                                .t`When receiving an email from another ${MAIL_APP_NAME} user who does not have trusted keys in your contacts, a banner will ask if you want to enable trusted keys.`}{' '}
                            <Href href={getKnowledgeBaseUrl('/address-verification')}>{c('Link').t`Learn more`}</Href>
                        </SettingsToggleRow.Description>
                    </>
                }
                toggle={<PromptPinToggle id="prompt-pin-toggle" />}
            />
            {showKTSetting && (
                <SettingsToggleRow
                    id="kt-toggle"
                    label={
                        <>
                            <SettingsToggleRow.Label>
                                {c('Label').t`Verify keys with Key Transparency`}
                                <BetaBadge />
                            </SettingsToggleRow.Label>
                            <SettingsToggleRow.Description>
                                <Href href={getKnowledgeBaseUrl('/key-transparency')}>{c('Link').t`Learn more`}</Href>
                            </SettingsToggleRow.Description>
                        </>
                    }
                    toggle={<KTToggle id="kt-toggle" />}
                />
            )}
        </SettingsCardRows>
    );
};

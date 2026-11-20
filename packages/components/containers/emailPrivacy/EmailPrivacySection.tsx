import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { FeatureCode } from '@proton/features/interface';
import useFeatures from '@proton/features/useFeatures';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { IMAGE_PROXY_FLAGS } from '@proton/shared/lib/mail/mailSettings';

import { SettingsCardRows } from '../account/SettingsCardRows';
import { SettingsSelectRow } from '../account/SettingsSelectRow';
import { SettingsToggleRow } from '../account/SettingsToggleRow';
import PreventTrackingToggle from './PreventTrackingToggle';
import ProtectionModeSelect from './ProtectionModeSelect';
import RemoteToggle from './RemoteToggle';

const EmailPrivacySection = () => {
    const [{ ImageProxy }] = useMailSettings();
    const { getFeature } = useFeatures([FeatureCode.SpyTrackerProtectionIncorporator]);

    const { feature: featureSpyTrackerIncorporator } = getFeature(FeatureCode.SpyTrackerProtectionIncorporator);

    const showProtectionMode = ImageProxy !== IMAGE_PROXY_FLAGS.NONE && featureSpyTrackerIncorporator?.Value;

    const trackerProtectionLink = (
        <Href href={getKnowledgeBaseUrl('/email-tracker-protection')}>{c('Link').t`Learn more`}</Href>
    );

    return (
        <SettingsCardRows>
            <SettingsToggleRow
                id="remoteToggle"
                label={
                    <>
                        <SettingsToggleRow.Label>{c('Label').t`Auto show remote images`}</SettingsToggleRow.Label>
                        <SettingsToggleRow.Description>
                            {c('Info')
                                .t`Loaded content is being protected by our proxy when tracker protection is activated.`}{' '}
                            <Href href={getKnowledgeBaseUrl('/images-by-default')}>{c('Link').t`Learn more`}</Href>
                        </SettingsToggleRow.Description>
                    </>
                }
                toggle={<RemoteToggle id="remoteToggle" data-testid="privacy:remote-content-toggle" />}
            />
            <SettingsToggleRow
                id="preventTrackingToggle"
                label={
                    <>
                        <SettingsToggleRow.Label>{c('Label').t`Block email tracking`}</SettingsToggleRow.Label>
                        <SettingsToggleRow.Description>
                            {c('Info').t`Blocks senders from seeing if and when you opened a message.`}{' '}
                            {trackerProtectionLink}
                        </SettingsToggleRow.Description>
                    </>
                }
                toggle={
                    <PreventTrackingToggle
                        id="preventTrackingToggle"
                        data-testid="privacy:prevent-tracking-toggle"
                    />
                }
            />
            {showProtectionMode && (
                <SettingsSelectRow
                    id="protectiontModeToggle"
                    label={
                        <>
                            <SettingsSelectRow.Label>{c('Label').t`Protection mode`}</SettingsSelectRow.Label>
                            <SettingsSelectRow.Description>
                                {c('Info')
                                    .t`Hides identifying information by loading remote content through a proxy. Option to store content as attachments.`}{' '}
                                {trackerProtectionLink}
                            </SettingsSelectRow.Description>
                        </>
                    }
                    select={
                        <ProtectionModeSelect
                            id="protectiontModeToggle"
                            data-testid="privacy:protect-mode-select"
                        />
                    }
                />
            )}
        </SettingsCardRows>
    );
};

export default EmailPrivacySection;

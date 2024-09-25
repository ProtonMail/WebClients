import { useEffect, useState } from 'react';

import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';
import { FeatureCode, useFeatures } from '@proton/features';
import { useMailSettings } from '@proton/mail/mailSettings/hooks';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { DEFAULT_MAILSETTINGS, IMAGE_PROXY_FLAGS } from '@proton/shared/lib/mail/mailSettings';

import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import PreventTrackingToggle from './PreventTrackingToggle';
import ProtectionModeSelect from './ProtectionModeSelect';
import RemoteToggle from './RemoteToggle';

const EmailPrivacySection = () => {
    const [{ HideRemoteImages, ImageProxy } = DEFAULT_MAILSETTINGS] = useMailSettings();
    const [hideRemoteImages, setHideRemoteImages] = useState(HideRemoteImages);
    const [, setImageProxy] = useState(ImageProxy);
    const { getFeature } = useFeatures([FeatureCode.SpyTrackerProtectionIncorporator]);

    const { feature: featureSpyTrackerIncorporator } = getFeature(FeatureCode.SpyTrackerProtectionIncorporator);

    // Handle updates from the Event Manager.
    useEffect(() => {
        setImageProxy(ImageProxy);
    }, [ImageProxy]);

    const handleChangeShowImage = (newValue: number) => setHideRemoteImages(newValue);

    const showProtectionMode = ImageProxy !== IMAGE_PROXY_FLAGS.NONE && featureSpyTrackerIncorporator?.Value;

    return (
        <>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="remoteToggle" className="text-semibold">
                        <span className="mr-2">{c('Label').t`Auto show remote images`}</span>
                        <Info
                            url={getKnowledgeBaseUrl('/images-by-default')}
                            title={c('Info')
                                .t`Loaded content is being protected by our proxy when tracker protection is activated.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <RemoteToggle
                        id="remoteToggle"
                        hideRemoteImages={hideRemoteImages}
                        onChange={handleChangeShowImage}
                        data-testid="privacy:remote-content-toggle"
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
            <>
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <label htmlFor="preventTrackingToggle" className="text-semibold">
                            <span className="mr-2">{c('Label').t`Block email tracking`}</span>
                            <Info
                                url={getKnowledgeBaseUrl('/email-tracker-protection')}
                                title={c('Info').t`Blocks senders from seeing if and when you opened a message.`}
                            />
                        </label>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight isToggleContainer>
                        <PreventTrackingToggle
                            id="preventTrackingToggle"
                            preventTracking={ImageProxy}
                            data-testid="privacy:prevent-tracking-toggle"
                        />
                    </SettingsLayoutRight>
                </SettingsLayout>
                {showProtectionMode && (
                    <SettingsLayout>
                        <SettingsLayoutLeft>
                            <label htmlFor="protectiontModeToggle" className="text-semibold">
                                <span className="mr-2">{c('Label').t`Protection mode`}</span>
                                <Info
                                    url={getKnowledgeBaseUrl('/email-tracker-protection')}
                                    title={c('Info')
                                        .t`Hides identifying information by loading remote content through a proxy. Option to store content as attachments.`}
                                />
                            </label>
                        </SettingsLayoutLeft>
                        <SettingsLayoutRight isToggleContainer>
                            <ProtectionModeSelect
                                id="protectiontModeToggle"
                                defaultProtectionMode={ImageProxy}
                                data-testid="privacy:protect-mode-select"
                            />
                        </SettingsLayoutRight>
                    </SettingsLayout>
                )}
            </>
        </>
    );
};

export default EmailPrivacySection;

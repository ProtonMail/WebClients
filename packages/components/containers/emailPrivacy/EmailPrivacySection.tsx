import React, { useEffect, useState } from 'react';

import { c } from 'ttag';

import { IMAGE_PROXY_FLAGS, SHOW_IMAGES } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { Info } from '../../components/link';
import { useFeatures, useMailSettings } from '../../hooks';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import { FeatureCode } from '../features';
import PreventTrackingToggle from './PreventTrackingToggle';
import ProtectionModeSelect from './ProtectionModeSelect';
import RemoteToggle from './RemoteToggle';

const { REMOTE } = SHOW_IMAGES;

const EmailPrivacySection = () => {
    const [{ ShowImages = REMOTE, ImageProxy = IMAGE_PROXY_FLAGS.PROXY } = {}] = useMailSettings();
    const [showImages, setShowImages] = useState(ShowImages);
    const [, setImageProxy] = useState(ImageProxy);
    const [{ feature: featureSpyTracker }, { feature: featureSpyTrackerIncorporator }] = useFeatures([
        FeatureCode.SpyTrackerProtection,
        FeatureCode.SpyTrackerProtectionIncorporator,
    ]);

    // Handle updates from the Event Manager.
    useEffect(() => {
        setImageProxy(ImageProxy);
    }, [ImageProxy]);

    const handleChangeShowImage = (newValue: number) => setShowImages(newValue);

    const showSpyTracker = featureSpyTracker?.Value;
    const showProtectionMode = ImageProxy !== IMAGE_PROXY_FLAGS.NONE && featureSpyTrackerIncorporator?.Value;

    return (
        <>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="remoteToggle" className="text-semibold">
                        <span className="mr0-5">{c('Label').t`Ask before loading remote content`}</span>
                        <Info
                            url={getKnowledgeBaseUrl('/images-by-default')}
                            title={c('Info')
                                .t`Prevents content from the sender's server from loading without your permission.`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="pt0-5">
                    <RemoteToggle
                        id="remoteToggle"
                        showImages={showImages}
                        onChange={handleChangeShowImage}
                        data-testid="privacy:remote-content-toggle"
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
            {showSpyTracker && (
                <>
                    <SettingsLayout>
                        <SettingsLayoutLeft>
                            <label htmlFor="preventTrackingToggle" className="text-semibold">
                                <span className="mr0-5">{c('Label').t`Block email tracking`}</span>
                                <Info
                                    url={getKnowledgeBaseUrl('/email-tracker-protection')}
                                    title={c('Info').t`Blocks senders from seeing if and when you opened a message.`}
                                />
                            </label>
                        </SettingsLayoutLeft>
                        <SettingsLayoutRight className="pt0-5">
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
                                    <span className="mr0-5">{c('Label').t`Protection mode`}</span>
                                    <Info
                                        url={getKnowledgeBaseUrl('/email-tracker-protection')}
                                        title={c('Info')
                                            .t`Hides identifying information by loading remote content through a proxy. Option to store content as attachments.`}
                                    />
                                </label>
                            </SettingsLayoutLeft>
                            <SettingsLayoutRight className="pt0-5">
                                <ProtectionModeSelect
                                    id="protectiontModeToggle"
                                    defaultProtectionMode={ImageProxy}
                                    data-testid="privacy:protect-mode-select"
                                />
                            </SettingsLayoutRight>
                        </SettingsLayout>
                    )}
                </>
            )}
        </>
    );
};

export default EmailPrivacySection;

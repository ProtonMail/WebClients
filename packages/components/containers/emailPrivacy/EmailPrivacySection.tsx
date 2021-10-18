import React, { useEffect, useState } from 'react';
import { c } from 'ttag';
import { IMAGE_PROXY_FLAGS, SHOW_IMAGES } from '@proton/shared/lib/constants';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import { Info } from '../../components/link';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import RemoteToggle from './RemoteToggle';
import SettingsLayout from '../account/SettingsLayout';
import { useFeature, useMailSettings } from '../../hooks';
import PreventTrackingToggle from './PreventTrackingToggle';
import { FeatureCode } from '../features';
import ProtectionModeSelect from './ProtectionModeSelect';

const { REMOTE } = SHOW_IMAGES;

const EmailPrivacySection = () => {
    const [{ ShowImages = REMOTE, ImageProxy = IMAGE_PROXY_FLAGS.PROXY } = {}] = useMailSettings();
    const [showImages, setShowImages] = useState(ShowImages);
    const [, setImageProxy] = useState(ImageProxy);
    const { feature } = useFeature(FeatureCode.SpyTrackerProtection);

    // Handle updates from the Event Manager.
    useEffect(() => {
        setImageProxy(ImageProxy);
    }, [ImageProxy]);

    const handleChangeShowImage = (newValue: number) => setShowImages(newValue);

    return (
        <>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="remoteToggle" className="text-semibold">
                        <span className="mr0-5">{c('Label').t`Confirm before loading remote content`}</span>
                        <Info
                            url="https://protonmail.com/support/knowledge-base/images-by-default/"
                            title={c('Info').t`Prevents remote email content from loading automatically.`}
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
            {feature?.Value && (
                <>
                    <SettingsLayout>
                        <SettingsLayoutLeft>
                            <label htmlFor="preventTrackingToggle" className="text-semibold">
                                <span className="mr0-5">{c('Label').t`Protect against email tracking`}</span>
                                <Info
                                    url="https://protonmail.com/support/email-tracker-protection"
                                    title={c('Info')
                                        .t`Prevents senders from knowing whether and when you have opened a message.`}
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
                    {ImageProxy !== IMAGE_PROXY_FLAGS.NONE && (
                        <SettingsLayout>
                            <SettingsLayoutLeft>
                                <label htmlFor="protectiontModeToggle" className="text-semibold">
                                    <span className="mr0-5">{c('Label').t`Protection mode`}</span>
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

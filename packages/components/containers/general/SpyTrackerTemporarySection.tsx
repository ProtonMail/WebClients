import { useState, useEffect } from 'react';
import { c } from 'ttag';
import { IMAGE_PROXY_FLAGS } from '@proton/shared/lib/constants';
import { useMailSettings } from '../../hooks';
import { SettingsSection } from '../account';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import ImageProxyToggle from './ImageProxyToggle';

const SpyTrackerTemporarySection = () => {
    const [{ ImageProxy = 0 } = {}] = useMailSettings();
    const [, setImageProxy] = useState(ImageProxy);

    // Handle updates from the Event Manager.
    useEffect(() => {
        setImageProxy(ImageProxy);
    }, [ImageProxy]);

    return (
        <SettingsSection>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="incorporatorToggle" className="text-semibold">
                        {c('Title').t`Enable image incorporator`}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="flex flex-item-fluid flex-justify-space-between flex-align-items-center">
                    <ImageProxyToggle className="mr1" id="incorporatorToggle" bit={IMAGE_PROXY_FLAGS.INCORPORATOR} />
                </SettingsLayoutRight>
            </SettingsLayout>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="proxyToggle" className="text-semibold">
                        {c('Title').t`Enable image proxy`}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="flex flex-item-fluid flex-justify-space-between flex-align-items-center">
                    <ImageProxyToggle className="mr1" id="proxyToggle" bit={IMAGE_PROXY_FLAGS.PROXY} />
                </SettingsLayoutRight>
            </SettingsLayout>
        </SettingsSection>
    );
};

export default SpyTrackerTemporarySection;

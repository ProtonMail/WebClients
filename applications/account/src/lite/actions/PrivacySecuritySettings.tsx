import { c } from 'ttag';

import {
    RemoveImageMetadataToggle,
    RequestLinkConfirmationToggle,
    SenderImagesToggle,
    useApi,
    useEventManager,
    useMailSettings,
    useNotifications,
} from '@proton/components';
import PreventTrackingToggle from '@proton/components/containers/emailPrivacy/PreventTrackingToggle';
import useLoading from '@proton/hooks/useLoading';
import { updateRemoveImageMetadata } from '@proton/shared/lib/api/mailSettings';
import type { REMOVE_IMAGE_METADATA } from '@proton/shared/lib/mail/mailSettings';
import { DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/mailSettings';

import MobileSection from '../components/MobileSection';
import MobileSectionLabel from '../components/MobileSectionLabel';
import MobileSectionRow from '../components/MobileSectionRow';

import './MobileSettings.scss';

const PrivacySecuritySettings = ({
    layout,
    loader,
}: {
    layout: (children: React.ReactNode, props?: any) => React.ReactNode;
    loader: React.ReactNode;
}) => {
    const api = useApi();
    const { call } = useEventManager();
    const [loadingRemoveImageMetadata, withLoadingRemoveImageMetadata] = useLoading();
    const { createNotification } = useNotifications();
    const [mailSettings = DEFAULT_MAILSETTINGS, loadingMailSettings] = useMailSettings();
    const { ImageProxy, ConfirmLink, RemoveImageMetadata } = mailSettings;
    const loading = loadingMailSettings;
    const notifyPreferenceSaved = () => createNotification({ text: c('Success').t`Preference saved` });

    const handleRemoveImageMetadata = async (value: REMOVE_IMAGE_METADATA) => {
        await api(updateRemoveImageMetadata(value));
        await call();
        notifyPreferenceSaved();
    };

    if (loading) {
        return loader;
    }

    return layout(
        <div className="mobile-settings">
            <MobileSection>
                <MobileSectionRow>
                    <MobileSectionLabel
                        description={c('Info').t`Blocks senders from seeing if and when you opened a message.`}
                        htmlFor="preventTrackingToggle"
                    >{c('Label').t`Block email tracking`}</MobileSectionLabel>
                    <PreventTrackingToggle id="preventTrackingToggle" preventTracking={ImageProxy} />
                </MobileSectionRow>
                <MobileSectionRow>
                    <MobileSectionLabel
                        htmlFor="requestLinkConfirmationToggle"
                        description={c('Info')
                            .t`When you click on a link, this anti-phishing feature will ask you to confirm the URL of the web page.`}
                    >
                        {c('Label').t`Confirm link URLs`}
                    </MobileSectionLabel>
                    <RequestLinkConfirmationToggle confirmLink={ConfirmLink} id="requestLinkConfirmationToggle" />
                </MobileSectionRow>
                <MobileSectionRow>
                    <MobileSectionLabel
                        htmlFor="removeImageMetadata"
                        description={c('Info').t`Remove metadata from images to protect your privacy.`}
                    >{c('Label').t`Remove image metadata`}</MobileSectionLabel>
                    <RemoveImageMetadataToggle
                        id="removeImageMetadata"
                        removeImageMetadata={RemoveImageMetadata}
                        loading={loadingRemoveImageMetadata}
                        onChange={(newValue) => withLoadingRemoveImageMetadata(handleRemoveImageMetadata(newValue))}
                    />
                </MobileSectionRow>
                <MobileSectionRow>
                    <MobileSectionLabel
                        htmlFor="senderImages"
                        description={c('Info')
                            .t`Show each sender's image in the message list. The sender's initials will be shown if a photo is not available.`}
                    >{c('Label').t`Show sender images`}</MobileSectionLabel>
                    <SenderImagesToggle id="senderImages" />
                </MobileSectionRow>
            </MobileSection>
        </div>,
        { className: 'overflow-auto' }
    );
};

export default PrivacySecuritySettings;

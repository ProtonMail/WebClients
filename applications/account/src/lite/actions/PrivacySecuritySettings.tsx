import { c } from 'ttag';

import {
    RemoveImageMetadataToggle,
    RequestLinkConfirmationToggle,
    SenderImagesToggle,
    useApi,
    useNotifications,
} from '@proton/components';
import PreventTrackingToggle from '@proton/components/containers/emailPrivacy/PreventTrackingToggle';
import RemoteToggle from '@proton/components/containers/emailPrivacy/RemoteToggle';
import EmbeddedToggle from '@proton/components/containers/messages/EmbeddedToggle';
import useLoading from '@proton/hooks/useLoading';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { updateRemoveImageMetadata } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/mailSettings';

import { useAccountDispatch } from '../../app/store/hooks';
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
    const dispatch = useAccountDispatch();
    const [loadingRemoveImageMetadata, withLoadingRemoveImageMetadata] = useLoading();
    const { createNotification } = useNotifications();
    const [mailSettings = DEFAULT_MAILSETTINGS, loadingMailSettings] = useMailSettings();
    const { ImageProxy, ConfirmLink, RemoveImageMetadata } = mailSettings;
    const loading = loadingMailSettings;
    const notifyPreferenceSaved = () => createNotification({ text: c('Success').t`Preference saved` });

    const handleRemoveImageMetadata = async (value: boolean) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateRemoveImageMetadata(value));
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
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
                <MobileSectionRow>
                    <MobileSectionLabel
                        htmlFor="embeddedToggle"
                        description={c('Info')
                            .t`When disabled, this prevents image files from loading on your device without your knowledge.`}
                    >{c('Label').t`Auto show embedded images`}</MobileSectionLabel>
                    <EmbeddedToggle id="embeddedToggle" />
                </MobileSectionRow>
                <MobileSectionRow>
                    <MobileSectionLabel
                        htmlFor="remoteToggle"
                        description={c('Info')
                            .t`When disabled, this prevents remote images from loading without your knowledge.`}
                    >{c('Label').t`Auto show remote images`}</MobileSectionLabel>
                    <RemoteToggle id="remoteToggle" data-testid="privacy:remote-content-toggle" />
                </MobileSectionRow>
            </MobileSection>
        </div>,
        { className: 'overflow-auto' }
    );
};

export default PrivacySecuritySettings;

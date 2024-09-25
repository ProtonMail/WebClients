import { useEffect } from 'react';

import { c, msgid } from 'ttag';

import { Href } from '@proton/atoms';
import { Dropdown, Icon, useModalState, usePopperAnchor } from '@proton/components';
import PreventTrackingToggle from '@proton/components/containers/emailPrivacy/PreventTrackingToggle';
import { useApi, useSpotlightOnFeature } from '@proton/components/hooks';
import { FeatureCode } from '@proton/features';
import { TelemetryMailEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import noTrackersImage from '@proton/styles/assets/img/illustrations/no-trackers-found.svg';
import trackersImage from '@proton/styles/assets/img/illustrations/trackers-found.svg';

import useMailModel from 'proton-mail/hooks/useMailModel';
import { useMailDispatch } from 'proton-mail/store/hooks';

import { emailTrackerProtectionURL } from '../../../constants';
import { useMessageTrackers } from '../../../hooks/message/useMessageTrackers';
import { loadFakeTrackers } from '../../../store/messages/images/messagesImagesActions';
import type { MessageState } from '../../../store/messages/messagesTypes';
import SpyTrackerIcon from './SpyTrackerIcon';
import SpyTrackerModal from './SpyTrackerModal';
import UTMTrackerModal from './UTMTrackerModal';

const getTitle = (needsMoreProtection: boolean, trackersCount: number) => {
    if (needsMoreProtection) {
        return c('Title').t`Protect yourself from trackers`;
    } else {
        if (trackersCount > 0) {
            // translator: trackersCount refers to the number of image trackers + utm trackers found in the message
            return c('Title').ngettext(
                msgid`We protected you from ${trackersCount} tracker`,
                `We protected you from ${trackersCount} trackers`,
                trackersCount
            );
        } else {
            return c('Title').t`No trackers found`;
        }
    }
};

const getDescription = (needsMoreProtection: boolean, hasTrackers: boolean) => {
    if (needsMoreProtection) {
        return c('Description')
            .t`Turn on email tracker protection to prevent advertisers and others from tracking your location and online activity.`;
    } else if (!hasTrackers) {
        return c('Description').t`We didn't find any known trackers and tracking URLs in this email.`;
    }

    return undefined;
};

interface Props {
    message: MessageState;
}

const PrivacyDropdown = ({ message }: Props) => {
    const api = useApi();
    const dispatch = useMailDispatch();
    const mailSettings = useMailModel('MailSettings');
    const [spyTrackerModalProps, setSpyTrackerModalOpen, renderSpyTrackerModal] = useModalState();
    const [utmTrackerModalProps, setUTMTrackerModalOpen, renderUTMTrackerModal] = useModalState();

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const {
        numberOfImageTrackers,
        imageTrackerText,
        needsMoreProtection,
        hasImageTrackers,
        numberOfUTMTrackers,
        utmTrackerText,
        hasUTMTrackers,
        hasTrackers,
        canCleanUTMTrackers,
    } = useMessageTrackers(message);

    const { show: showSpotlight, onDisplayed } = useSpotlightOnFeature(FeatureCode.PrivacyDropdownOpened, hasTrackers);

    // On the first email opened with trackers, we want to open the privacy dropdown
    useEffect(() => {
        if (showSpotlight) {
            toggle();
            onDisplayed();
        }
    }, [showSpotlight]);

    const title = getTitle(needsMoreProtection, numberOfImageTrackers + numberOfUTMTrackers);
    const description = getDescription(needsMoreProtection, hasTrackers);

    const handleShowImageTrackersDetails = () => {
        if (numberOfImageTrackers > 0) {
            setSpyTrackerModalOpen(true);
        }
    };

    const handleShowUTMTrackersDetails = () => {
        if (numberOfUTMTrackers > 0) {
            setUTMTrackerModalOpen(true);
        }
    };

    const imageTrackerRow = (
        <span className="flex flex-nowrap items-center text-left px-2 py-2" data-testid="privacy:image-row">
            <span className="flex mr-2 shrink-0 color-success">
                <Icon name={'checkmark-circle-filled'} className="my-auto" />
            </span>
            <span className="flex-1">{imageTrackerText}</span>
            {hasImageTrackers && (
                <span className="flex rtl:mirror ml-4">
                    <Icon name="chevron-right" />
                </span>
            )}
        </span>
    );

    const utmTrackerRow = (
        <span className="flex flex-nowrap items-center text-left px-2 py-2" data-testid="privacy:utm-row">
            <span className="flex mr-2 shrink-0 color-success">
                <Icon name={'checkmark-circle-filled'} />
            </span>
            <span className="flex-1">{utmTrackerText}</span>
            {hasUTMTrackers && (
                <span className="flex rtl:mirror ml-4">
                    <Icon name="chevron-right" />
                </span>
            )}
        </span>
    );

    // When the user enable the setting, the shield icon should not be displayed because we never check for trackers
    // A workaround for that is to set the trackerStatus to true for the current message
    const handleEnableProxy = async () => {
        dispatch(loadFakeTrackers({ ID: message.localID }));
    };

    const handleOpenDropdown = () => {
        toggle();

        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailPrivacyDropdown,
            event: TelemetryMailEvents.privacy_dropdown_opened,
        });
    };

    return (
        <>
            <SpyTrackerIcon
                numberOfTrackers={numberOfImageTrackers + numberOfUTMTrackers}
                needsMoreProtection={needsMoreProtection}
                title={imageTrackerText.concat(',', utmTrackerText)}
                onClick={handleOpenDropdown}
                ref={anchorRef}
            />
            <Dropdown anchorRef={anchorRef} isOpen={isOpen} onClose={close} originalPlacement="bottom-end">
                <div className="p-4" data-testid="privacy:dropdown-content">
                    <img src={hasTrackers ? trackersImage : noTrackersImage} alt={title} className="block m-auto" />
                    <div className="flex text-center justify-center">
                        <span className="my-4">
                            <h5 className="text-bold mb-2" tabIndex={-2} data-testid="privacy:title">
                                {title}
                            </h5>
                            {description && <span data-testid="privacy:description">{description}</span>}
                            <br />
                            <Href className="ml-1" href={emailTrackerProtectionURL} data-testid="privacy:learn-more">{c(
                                'Info'
                            ).t`Learn more`}</Href>
                        </span>
                    </div>

                    {needsMoreProtection ? (
                        <>
                            <hr className="my-4" />

                            <div className="text-center">
                                <div className="inline-flex flex-nowrap items-center justify-center">
                                    <PreventTrackingToggle
                                        id="preventTrackingToggle"
                                        preventTracking={mailSettings.ImageProxy}
                                        data-testid="privacy:prevent-tracking-toggle"
                                        onEnable={handleEnableProxy}
                                    />
                                    <span className="ml-2">{c('Action').t`Block email tracking`}</span>
                                </div>
                            </div>

                            <hr className="mt-4 mb-2" />
                        </>
                    ) : (
                        hasTrackers && (
                            <>
                                <hr className="my-1" />

                                {hasImageTrackers && (
                                    <>
                                        <button
                                            onClick={handleShowImageTrackersDetails}
                                            className="interactive w-full rounded-sm"
                                            data-testid="privacy:spy-trackers-row"
                                        >
                                            {imageTrackerRow}
                                        </button>

                                        <hr className="my-1" />
                                    </>
                                )}

                                {canCleanUTMTrackers && hasUTMTrackers && (
                                    <>
                                        <button
                                            onClick={handleShowUTMTrackersDetails}
                                            className="interactive w-full rounded-sm"
                                            data-testid="privacy:link-trackers-row"
                                        >
                                            {utmTrackerRow}
                                        </button>
                                        <hr className="my-1" />
                                    </>
                                )}
                            </>
                        )
                    )}
                </div>
            </Dropdown>

            {renderSpyTrackerModal && <SpyTrackerModal message={message} {...spyTrackerModalProps} />}
            {renderUTMTrackerModal && <UTMTrackerModal message={message} {...utmTrackerModalProps} />}
        </>
    );
};

export default PrivacyDropdown;

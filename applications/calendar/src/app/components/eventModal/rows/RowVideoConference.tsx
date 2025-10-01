import { useRef, useState } from 'react';

import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms';
import { ProtonMeetRow, ZoomRow, useProtonMeetIntegration, useZoomIntegration } from '@proton/calendar';
import { PROTON_MEET_REGEX_LOCATION } from '@proton/calendar/components/videoConferencing/protonMeet/protonMeetHelpers';
import {
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    IconRow,
    ProtonLogo,
    Spotlight,
    ZoomUpsellModal,
} from '@proton/components';
import { IcVideoCamera } from '@proton/icons';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import { type EventModel, VIDEO_CONFERENCE_PROVIDER } from '@proton/shared/lib/interfaces/calendar';
import { useFlag } from '@proton/unleash';
import isTruthy from '@proton/utils/isTruthy';

import useVideoConferenceSpotlight from '../../../hooks/useVideoConferenceSpotlight';

import './RowVideoConference.scss';

interface Props {
    model: EventModel;
    isCreateEvent: boolean;
    setModel: (value: EventModel) => void;
    hasZoomError: boolean;
    setIsVideoConferenceLoading: (value: boolean) => void;
}

export const RowVideoConference = ({
    model,
    setModel,
    isCreateEvent,
    hasZoomError,
    setIsVideoConferenceLoading,
}: Props) => {
    const [user] = useUser();
    const [organization] = useOrganization();
    const isZoomIntegrationEnabled = useFlag('ZoomIntegration');

    const isMeetVideoConferenceEnabled = useFlag('NewScheduleOption');

    const isZoomSettingEnabled = organization?.Settings.VideoConferencingEnabled;
    const isProtonMeetSettingEnabled = organization?.Settings.MeetVideoConferencingEnabled;

    const { spotlightContent, shouldShowSotlight, onDisplayed, onClose } = useVideoConferenceSpotlight({
        isEventCreation: isCreateEvent,
    });

    const isZoomMeeting = !!model.conferenceUrl?.includes('zoom.us') && !model.isConferenceTmpDeleted;
    const isProtonMeetMeeting =
        !!model.conferenceUrl?.match(PROTON_MEET_REGEX_LOCATION) && !model.isConferenceTmpDeleted;

    const anchorRef = useRef<HTMLButtonElement>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const getAccessLevel = () => {
        if (!user.hasPaidMail) {
            return 'show-upsell';
        }
        return user.hasPaidMail && isZoomSettingEnabled ? 'full-access' : 'limited-access';
    };

    const getActiveProvider = () => {
        if (isProtonMeetMeeting) {
            return VIDEO_CONFERENCE_PROVIDER.PROTON_MEET;
        }
        if (isZoomMeeting) {
            return VIDEO_CONFERENCE_PROVIDER.ZOOM;
        }
        return null;
    };

    const [activeProvider, setActiveProvider] = useState<VIDEO_CONFERENCE_PROVIDER | null>(getActiveProvider());

    const zoomIntegration = useZoomIntegration({
        hasZoomError,
        model,
        setModel,
        onRowClick: () => onClose(),
        setActiveProvider,
    });

    const protonMeetIntegration = useProtonMeetIntegration({
        model,
        setModel,
        isActive: isProtonMeetMeeting,
        setActiveProvider,
        setIsVideoConferenceLoading,
    });

    const zoomAccessLevel = getAccessLevel();
    const shouldShowZoom = isZoomIntegrationEnabled && zoomAccessLevel !== 'limited-access';
    const zoomIntegrationLoading = zoomIntegration.loadingConfig || zoomIntegration.oauthTokenLoading;

    const videoConferenceProviderDetails = [
        isMeetVideoConferenceEnabled &&
            isProtonMeetSettingEnabled && {
                id: VIDEO_CONFERENCE_PROVIDER.PROTON_MEET,
                onClick: protonMeetIntegration.createVideoConferenceMeeting,
                buttonContent: c('Label').t`Add ${MEET_APP_NAME} conferencing`,
                itemContent: (
                    <>
                        <ProtonLogo className="mr-2" variant="glyph-only" size={4} /> {MEET_APP_NAME}
                    </>
                ),
                disabled: false,
                loading: false,
            },
        shouldShowZoom && {
            id: VIDEO_CONFERENCE_PROVIDER.ZOOM,
            onClick: zoomIntegration.handleClick,
            buttonContent: (
                <div className="flex items-center gap-2">
                    {c('Label').t`Add Zoom meeting`}
                    {user.hasPaidMail ? null : <Icon name="upgrade" className="color-primary" />}
                </div>
            ),
            itemContent: (
                <>
                    <IcVideoCamera className="mr-2" size={5} /> {c('Label').t`Zoom meeting`}
                    {user.hasPaidMail ? null : <Icon name="upgrade" className="ml-auto color-primary" />}
                </>
            ),
            disabled: zoomIntegrationLoading,
            loading: zoomIntegrationLoading,
        },
    ].filter((item) => isTruthy(item));

    const defaultVideoConferenceProvider = videoConferenceProviderDetails[0];

    const shouldDisplayAddButton =
        !activeProvider &&
        !isZoomMeeting &&
        !isProtonMeetMeeting &&
        videoConferenceProviderDetails.length > 0 &&
        !hasZoomError;

    return (
        <>
            {shouldDisplayAddButton && (
                <>
                    <IconRow
                        icon="video-camera"
                        title={c('Label').t`Video conference`}
                        className="flex flex-nowrap items-center justify-space-between w-full"
                    >
                        <Button
                            onClick={() => {
                                setIsDropdownOpen(false);
                                void defaultVideoConferenceProvider.onClick();
                            }}
                            shape="underline"
                            color="norm"
                            disabled={defaultVideoConferenceProvider.disabled}
                            loading={defaultVideoConferenceProvider.loading}
                        >
                            {defaultVideoConferenceProvider.buttonContent}
                        </Button>
                        {videoConferenceProviderDetails.length > 1 && (
                            <>
                                <DropdownButton
                                    ref={anchorRef}
                                    isOpen={isDropdownOpen}
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    hasCaret
                                    shape="outline"
                                    size="small"
                                    icon
                                />
                                <Dropdown
                                    className="w-custom"
                                    isOpen={isDropdownOpen}
                                    anchorRef={anchorRef}
                                    originalPlacement="bottom-end"
                                    availablePlacements={['bottom-end']}
                                    style={{ '--w-custom': '16rem' }}
                                    onClose={() => setIsDropdownOpen(false)}
                                    contentProps={{
                                        className: 'video-conference-dropdown-content',
                                    }}
                                >
                                    <DropdownMenu className="w-full">
                                        {videoConferenceProviderDetails.map(
                                            ({ id, onClick, itemContent, disabled, loading }) => {
                                                return (
                                                    <DropdownMenuButton
                                                        key={id}
                                                        className="text-left flex items-center gap-2 h-custom relative"
                                                        onClick={() => {
                                                            setIsDropdownOpen(false);
                                                            void onClick();
                                                        }}
                                                        style={{
                                                            '--h-custom': '3.125rem',
                                                        }}
                                                        disabled={disabled}
                                                        loading={loading}
                                                    >
                                                        <div className="w-full py-2 flex">{itemContent}</div>
                                                        <div className="dropdown-item-hr absolute bottom-0 left-0 w-full" />
                                                    </DropdownMenuButton>
                                                );
                                            }
                                        )}
                                    </DropdownMenu>
                                </Dropdown>
                            </>
                        )}
                    </IconRow>
                </>
            )}
            {(isProtonMeetMeeting || activeProvider === VIDEO_CONFERENCE_PROVIDER.PROTON_MEET) && (
                <ProtonMeetRow model={model} {...protonMeetIntegration} />
            )}
            {(isZoomMeeting || activeProvider === VIDEO_CONFERENCE_PROVIDER.ZOOM || hasZoomError) && (
                <Spotlight
                    content={spotlightContent}
                    className="ml-2"
                    show={shouldShowSotlight}
                    onDisplayed={onDisplayed}
                    originalPlacement="left"
                    onClose={onClose}
                >
                    <div>
                        <ZoomRow
                            model={model}
                            setModel={setModel}
                            accessLevel={zoomAccessLevel}
                            onRowClick={() => onClose()}
                            hasZoomError={hasZoomError}
                            {...zoomIntegration}
                        />
                    </div>
                </Spotlight>
            )}
            {zoomIntegration.zoomUpsellModal.render && (
                <ZoomUpsellModal modalProps={zoomIntegration.zoomUpsellModal.modalProps} />
            )}
        </>
    );
};

import { useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useNotifications } from '@proton/components';
import { type Meeting, useGetMeetingDependencies, useProtonMeet } from '@proton/meet';
import { MeetingType } from '@proton/meet/types/response-types';
import { getPassphraseFromEncryptedPassword } from '@proton/meet/utils/cryptoUtils';
import { parseMeetingLink } from '@proton/meet/utils/parseMeetingLink';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS, MEET_APP_NAME } from '@proton/shared/lib/constants';
import { VIDEO_CONFERENCE_PROVIDER } from '@proton/shared/lib/interfaces/calendar/Api';
import type { EventModel } from '@proton/shared/lib/interfaces/calendar/Event';
import { useFlag } from '@proton/unleash';

import { calendarUrlQueryParams } from '../../constants';
import {
    VideoConferenceProtonMeetIntegration,
    useVideoConfTelemetry,
} from '../videoConferencing/useVideoConfTelemetry';
import type { IntegrationState } from './types';

interface UseProtonMeetIntegrationParameters {
    model: EventModel;
    setModel: (value: EventModel) => void;
    isActive: boolean;
    setActiveProvider: (provider: VIDEO_CONFERENCE_PROVIDER | null) => void;
    setIsVideoConferenceLoading: (value: boolean) => void;
}

export const useProtonMeetIntegration = ({
    model,
    setModel,
    isActive,
    setActiveProvider,
    setIsVideoConferenceLoading,
}: UseProtonMeetIntegrationParameters) => {
    const history = useHistory();
    const location = useLocation();

    const isProtonMeetEnabled = useFlag('NewScheduleOption');

    const [user] = useUser();

    const notifications = useNotifications();

    const [processState, setProcessState] = useState<IntegrationState | undefined>(
        isActive ? 'meeting-present' : undefined
    );

    const [meetingObject, setMeetingObject] = useState<Meeting | null>(null);

    const [meetingDetails, setMeetingDetails] = useState({
        id: '',
        passwordBase: '',
        passphrase: '',
        failed: false,
        hidePassphrase: !isProtonMeetEnabled,
    });

    const modelRef = useRef(model);

    modelRef.current = model;

    const { createProtonMeet, getProtonMeetByLinkName, saveProtonMeetPassword } = useProtonMeet();

    const getMeetingDependencies = useGetMeetingDependencies();

    const { sentEventProtonMeet } = useVideoConfTelemetry();

    const createVideoConferenceMeeting = async () => {
        if (processState === 'loading' || processState === 'meeting-present') {
            return;
        }

        setIsVideoConferenceLoading(true);

        setActiveProvider(VIDEO_CONFERENCE_PROVIDER.PROTON_MEET);

        if (
            model.isConferenceTmpDeleted &&
            model.conferenceUrl &&
            model.conferenceProvider === VIDEO_CONFERENCE_PROVIDER.PROTON_MEET
        ) {
            setModel({
                ...model,
                isConferenceTmpDeleted: false,
            });

            setProcessState('meeting-present');

            return;
        }

        setProcessState('loading');

        try {
            const { meetingLink, id, meeting } = await createProtonMeet({
                meetingName: model.title,
                type: MeetingType.SCHEDULED,
            });

            const { meetingId, urlPassword } = parseMeetingLink(meetingLink);

            const { userKeys } = await getMeetingDependencies();

            const passphrase = await getPassphraseFromEncryptedPassword({
                encryptedPassword: meeting?.Password as string,
                basePassword: urlPassword,
                userKeys,
            });

            setMeetingDetails({
                id: meetingId ?? '',
                passwordBase: urlPassword,
                passphrase,
                failed: false,
                hidePassphrase: false,
            });

            setModel({
                ...modelRef.current,
                conferenceId: id,
                conferenceUrl: getAppHref(meetingLink, APPS.PROTONMEET),
                conferenceHost: user.Email,
                conferenceProvider: VIDEO_CONFERENCE_PROVIDER.PROTON_MEET,
                isConferenceTmpDeleted: false,
            });

            setMeetingObject(meeting);

            setProcessState('meeting-present');

            sentEventProtonMeet(VideoConferenceProtonMeetIntegration.create_proton_meet);
        } catch (error) {
            setActiveProvider(null);

            sentEventProtonMeet(VideoConferenceProtonMeetIntegration.create_proton_meet_failed);

            notifications.createNotification({
                key: 'proton-meet-row-create-meeting-error',
                type: 'error',
                text: c('meet_2025 Error').t`Failed to create ${MEET_APP_NAME} video conference`,
            });

            setProcessState(undefined);
        } finally {
            setIsVideoConferenceLoading(false);
        }
    };

    const handlePassphraseSave = async (passphrase: string) => {
        const updatedMeeting = await saveProtonMeetPassword({
            passphrase,
            id: meetingObject?.ID as string,
            passwordBase: meetingDetails.passwordBase,
            meetingObject: meetingObject as Meeting,
        });

        setMeetingDetails((prev) => ({
            ...prev,
            passphrase,
        }));

        setMeetingObject(updatedMeeting);
    };

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);

        const shouldCreateMeeting =
            (Number(searchParams.get(calendarUrlQueryParams.videoConferenceProvider)) as VIDEO_CONFERENCE_PROVIDER) ===
            VIDEO_CONFERENCE_PROVIDER.PROTON_MEET;

        if (shouldCreateMeeting) {
            void createVideoConferenceMeeting();

            // Cleanup so the query params don't have the create action anymore
            searchParams.delete(calendarUrlQueryParams.videoConferenceProvider);

            history.replace({
                ...location,
                search: searchParams.toString() ? `?${searchParams.toString()}` : '',
            });
        }
    }, [history, location]);

    const setupInProgress = useRef(false);

    const setup = async () => {
        if (!model.conferenceId || !model.conferenceUrl || setupInProgress.current || !isProtonMeetEnabled) {
            return;
        }

        const { meetingId, urlPassword } = parseMeetingLink(model.conferenceUrl);

        if (!meetingId) {
            return;
        }

        setupInProgress.current = true;

        const { userKeys } = await getMeetingDependencies();

        let meeting: Meeting;

        try {
            meeting = await getProtonMeetByLinkName(meetingId);
        } catch {
            setMeetingDetails((prev) => ({
                ...prev,
                failed: true,
            }));

            setupInProgress.current = false;

            return;
        }

        const passphrase = await getPassphraseFromEncryptedPassword({
            encryptedPassword: meeting?.Password as string,
            basePassword: urlPassword,
            userKeys,
        });

        setMeetingDetails({
            id: meetingId ?? '',
            passwordBase: urlPassword,
            passphrase,
            failed: false,
            hidePassphrase: false,
        });

        setMeetingObject(meeting as Meeting);

        setupInProgress.current = false;
    };

    useEffect(() => {
        if (isActive && !meetingDetails.id && model.conferenceUrl) {
            void setup();
        }
    }, []);

    return {
        handlePassphraseSave,
        processState,
        meetingObject,
        meetingDetails,
        createVideoConferenceMeeting,
        deleteProtonMeet: () => {
            setActiveProvider(null);
            setModel({
                ...model,
                isConferenceTmpDeleted: true,
            });

            setProcessState(undefined);
        },
        setup,
    };
};

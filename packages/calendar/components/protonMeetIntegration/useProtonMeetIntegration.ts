import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useNotifications } from '@proton/components';
import type { SessionKey } from '@proton/crypto';
import { useGetMeetingDependencies, useProtonMeet } from '@proton/meet';
import {
    decryptSessionKey,
    encryptMeetingName,
    getPassphraseFromEncryptedPassword,
} from '@proton/meet/utils/cryptoUtils';
import { parseMeetingLink } from '@proton/meet/utils/parseMeetingLink';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS, MEET_APP_NAME } from '@proton/shared/lib/constants';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';
import { MeetingType } from '@proton/shared/lib/interfaces/Meet';
import { VIDEO_CONFERENCE_PROVIDER } from '@proton/shared/lib/interfaces/calendar/Api';
import type { EventModel } from '@proton/shared/lib/interfaces/calendar/Event';
import { useFlag } from '@proton/unleash';
import debounce from '@proton/utils/debounce';

import { calendarUrlQueryParams } from '../../constants';
import { hasValidVideoConferenceInData } from '../videoConferencing/hasValidVideoConferenceInData';
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

    const [organization] = useOrganization();

    const isProtonMeetSettingEnabled = organization?.Settings.MeetVideoConferencingEnabled;

    const isMeetVideoConferenceEnabled = useFlag('NewScheduleOption');
    const isMeetPassphraseEnabled = useFlag('MeetPassphraseEnabled');
    const isAutoAddMeetingLinkEnabled = useFlag('AutoAddMeetingLink');

    const [user] = useUser();

    const notifications = useNotifications();

    const [processState, setProcessState] = useState<IntegrationState | undefined>(
        isActive ? 'meeting-present' : undefined
    );

    const [meetingObject, setMeetingObject] = useState<Meeting | null>(null);

    const isCurrentUserMeetingHost = user.Email === model.conferenceHost;

    const [meetingDetails, setMeetingDetails] = useState({
        id: '',
        passwordBase: '',
        passphrase: '',
        failed: false,
        hidePassphrase: !isMeetVideoConferenceEnabled || !isCurrentUserMeetingHost || !isMeetPassphraseEnabled,
    });

    const protonMeetConferenceDetails = useRef<{
        conferenceId: string;
        conferenceUrl: string;
    }>({
        conferenceId: '',
        conferenceUrl: '',
    });

    const modelRef = useRef(model);

    modelRef.current = model;

    const [sessionKey, setSessionKey] = useState<SessionKey | null>(null);

    const { createProtonMeet, getProtonMeetByLinkName, saveProtonMeetPassword } = useProtonMeet();

    const getMeetingDependencies = useGetMeetingDependencies();

    const { sentEventProtonMeet } = useVideoConfTelemetry();

    const createVideoConferenceMeeting = async () => {
        if (processState === 'loading' || processState === 'meeting-present') {
            return;
        }

        setActiveProvider(VIDEO_CONFERENCE_PROVIDER.PROTON_MEET);

        if (model.isConferenceTmpDeleted && protonMeetConferenceDetails.current.conferenceUrl) {
            setModel({
                ...model,
                conferenceId: protonMeetConferenceDetails.current.conferenceId,
                conferenceUrl: protonMeetConferenceDetails.current.conferenceUrl,
                conferenceProvider: VIDEO_CONFERENCE_PROVIDER.PROTON_MEET,
                isConferenceTmpDeleted: false,
            });

            setProcessState('meeting-present');

            return;
        }

        setIsVideoConferenceLoading(true);

        setProcessState('loading');

        try {
            const { meetingLink, id, meeting } = await createProtonMeet({
                meetingName: model.title,
                type: MeetingType.SCHEDULED,
                protonCalendar: true,
            });

            const { meetingId, urlPassword } = parseMeetingLink(meetingLink);

            const { userKeys } = await getMeetingDependencies();

            const { passphrase, password } = await getPassphraseFromEncryptedPassword({
                encryptedPassword: meeting?.Password as string,
                basePassword: urlPassword,
                userKeys,
            });

            const decryptedSessionKey = await decryptSessionKey({
                encryptedSessionKey: meeting?.SessionKey as string,
                password,
                salt: meeting?.Salt as string,
            });

            if (!decryptedSessionKey) {
                throw new Error('Missing session key');
            }

            setSessionKey(decryptedSessionKey);

            setMeetingDetails((prev) => ({
                ...prev,
                id: meetingId ?? '',
                passwordBase: urlPassword,
                passphrase,
                failed: false,
            }));

            setModel({
                ...modelRef.current,
                conferenceId: id,
                conferenceUrl: getAppHref(meetingLink, APPS.PROTONMEET),
                conferenceHost: user.Email,
                conferenceProvider: VIDEO_CONFERENCE_PROVIDER.PROTON_MEET,
                isConferenceTmpDeleted: false,
            });

            protonMeetConferenceDetails.current = {
                conferenceId: id,
                conferenceUrl: getAppHref(meetingLink, APPS.PROTONMEET),
            };

            setMeetingObject(meeting);

            setProcessState('meeting-present');

            sentEventProtonMeet(VideoConferenceProtonMeetIntegration.create_proton_meet);
        } catch (error) {
            setActiveProvider(null);

            sentEventProtonMeet(VideoConferenceProtonMeetIntegration.create_proton_meet_failed);

            notifications.createNotification({
                key: 'proton-meet-row-create-meeting-error',
                type: 'error',
                text: c('Error').t`Failed to create ${MEET_APP_NAME} video conference`,
            });

            setProcessState(undefined);
        } finally {
            setIsVideoConferenceLoading(false);
        }
    };

    const handlePassphraseSave = async (passphrase: string) => {
        if (!sessionKey) {
            return;
        }

        const updatedMeeting = await saveProtonMeetPassword({
            passphrase,
            id: meetingObject?.ID as string,
            passwordBase: meetingDetails.passwordBase,
            meetingObject: meetingObject as Meeting,
        });

        const encryptedTitle = await encryptMeetingName(model.title, sessionKey);

        setMeetingDetails((prev) => ({
            ...prev,
            passphrase,
        }));

        setModel({
            ...model,
            encryptedTitle,
        });

        setMeetingObject(updatedMeeting);
    };

    useEffect(() => {
        if (!isMeetVideoConferenceEnabled) {
            return;
        }

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
    }, [history, location, isMeetVideoConferenceEnabled]);

    const validAttendeeCount = model.attendees.filter((attendee) => attendee.email !== user.Email).length;
    const prevValidAttendeeCount = useRef(validAttendeeCount);

    useEffect(() => {
        const newlyAddedAttendees = validAttendeeCount > 0 && prevValidAttendeeCount.current === 0;
        const hasValidVideoConference = hasValidVideoConferenceInData(model);

        if (
            isMeetVideoConferenceEnabled &&
            isAutoAddMeetingLinkEnabled &&
            isProtonMeetSettingEnabled &&
            (!model.conferenceUrl || model.isConferenceTmpDeleted) &&
            !hasValidVideoConference &&
            newlyAddedAttendees
        ) {
            void createVideoConferenceMeeting();
        }

        prevValidAttendeeCount.current = validAttendeeCount;
    }, [
        isMeetVideoConferenceEnabled,
        validAttendeeCount,
        model.conferenceUrl,
        model.isConferenceTmpDeleted,
        model.conferenceProvider,
    ]);

    const setupInProgress = useRef(false);

    // Setup to access the meeting details (sessionKey, passphrase, password)
    const setup = async () => {
        if (
            !model.conferenceId ||
            !model.conferenceUrl ||
            setupInProgress.current ||
            !isMeetVideoConferenceEnabled ||
            !isCurrentUserMeetingHost
        ) {
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

        const { password, passphrase } = isMeetPassphraseEnabled
            ? await getPassphraseFromEncryptedPassword({
                  encryptedPassword: meeting?.Password as string,
                  basePassword: urlPassword,
                  userKeys,
              })
            : { password: urlPassword, passphrase: '' };

        const decryptedSessionKey = await decryptSessionKey({
            encryptedSessionKey: meeting?.SessionKey as string,
            password,
            salt: meeting?.Salt as string,
        });

        if (!decryptedSessionKey) {
            throw new Error('Missing session key');
        }

        setSessionKey(decryptedSessionKey);

        setMeetingDetails((prev) => ({
            ...prev,
            id: meetingId ?? '',
            passwordBase: urlPassword,
            passphrase,
            failed: false,
        }));

        setMeetingObject(meeting as Meeting);

        setupInProgress.current = false;
    };

    useEffect(() => {
        if (isActive && !meetingDetails.id && model.conferenceUrl) {
            void setup();
        }
    }, []);

    const prevTitle = useRef(model.title);

    const encryptTitle = useCallback(async () => {
        if (!sessionKey) {
            return;
        }

        const newModel = {
            ...modelRef.current,
            encryptedTitle: await encryptMeetingName(modelRef.current.title, sessionKey),
        };
        setModel(newModel);
    }, [sessionKey]);

    const debouncedEncryptTitle = useMemo(() => debounce(encryptTitle, 250), [encryptTitle]);

    useEffect(() => {
        if (prevTitle.current === model.title) {
            return;
        }

        prevTitle.current = model.title;

        void debouncedEncryptTitle();
    }, [model.title]);

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

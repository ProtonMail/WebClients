import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useNotifications } from '@proton/components';
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

    const isMeetVideoConferenceEnabled = useFlag('NewScheduleOption');
    const isMeetPassphraseEnabled = useFlag('MeetPassphraseEnabled');

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

    const modelRef = useRef(model);

    modelRef.current = model;

    const [sessionKey, setSessionKey] = useState<Uint8Array<ArrayBuffer> | null>(null);

    const { createProtonMeet, getProtonMeetByLinkName, saveProtonMeetPassword } = useProtonMeet();

    const getMeetingDependencies = useGetMeetingDependencies();

    const { sentEventProtonMeet } = useVideoConfTelemetry();

    const createVideoConferenceMeeting = async () => {
        if (processState === 'loading' || processState === 'meeting-present') {
            return;
        }

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

            setSessionKey(decryptedSessionKey as Uint8Array<ArrayBuffer>);

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

        setSessionKey(decryptedSessionKey as Uint8Array<ArrayBuffer>);

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

import { useCallback, useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button, CircleLoader } from '@proton/atoms';
import { useNotifications } from '@proton/components';
import IconRow from '@proton/components/components/iconRow/IconRow';
import { IcVideoCamera } from '@proton/icons';
import { type Meeting, useGetMeetingDependencies, useProtonMeet } from '@proton/meet';
import { MeetingType } from '@proton/meet/types/response-types';
import { getPassphraseFromEncryptedPassword } from '@proton/meet/utils/cryptoUtils';
import { parseMeetingLink } from '@proton/meet/utils/parseMeetingLink';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS, MEET_APP_NAME } from '@proton/shared/lib/constants';
import { VIDEO_CONFERENCE_PROVIDER } from '@proton/shared/lib/interfaces/calendar/Api';
import { type EventModel } from '@proton/shared/lib/interfaces/calendar/Event';

import { calendarUrlQueryParams } from '../../constants';
import { ProtonMeetMeetingDetails } from './ProtonMeetMeetingDetails';

type IntegrationState = 'meeting-present' | 'loading';

const getIcon = (state?: IntegrationState) => {
    if (state === 'meeting-present') {
        return <IcVideoCamera />;
    }

    if (state === 'loading') {
        return <CircleLoader className="color-primary h-4 w-4" />;
    }

    return <span />;
};

interface ProtonMeetRowProps {
    model: EventModel;
    setModel: (value: EventModel) => void;
    isActive: boolean;
}

export const ProtonMeetRow = ({ model, setModel, isActive }: ProtonMeetRowProps) => {
    const history = useHistory();
    const location = useLocation();

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
    });

    const {
        createProtonMeet,
        deleteProtonMeet,
        getProtonMeet,
        getProtonMeetByLinkName,
        saveProtonMeetPassword,
        saveProtonMeetName,
    } = useProtonMeet();

    const getMeetingDependencies = useGetMeetingDependencies();

    const createVideoConferenceMeeting = useCallback(async () => {
        if (processState === 'loading' || processState === 'meeting-present') {
            return;
        }

        setProcessState('loading');

        try {
            const { meetingLink, id, meeting } = await createProtonMeet({
                meetingName: model.title,
                type: MeetingType.SCHEDULED,
            });

            const { meetingId, urlPassword } = parseMeetingLink(meetingLink);

            const { privateKey } = await getMeetingDependencies();

            const passphrase = await getPassphraseFromEncryptedPassword({
                encryptedPassword: meeting?.Password as string,
                basePassword: urlPassword,
                privateKey,
            });

            setMeetingDetails({
                id: meetingId ?? '',
                passwordBase: urlPassword,
                passphrase,
            });

            setModel({
                ...model,
                conferenceId: id,
                conferenceUrl: getAppHref(meetingLink, APPS.PROTONMEET),
                conferenceHost: user.Email,
                conferenceProvider: VIDEO_CONFERENCE_PROVIDER.PROTON_MEET,
                isConferenceTmpDeleted: false,
            });

            setMeetingObject(meeting);

            setProcessState('meeting-present');
        } catch (error) {
            notifications.createNotification({
                key: 'proton-meet-row-create-meeting-error',
                type: 'error',
                text: c('l10n_nightly Error').t`Failed to create meeting`,
            });

            setProcessState(undefined);
        }
    }, [
        createProtonMeet,
        getMeetingDependencies,
        model,
        notifications,
        saveProtonMeetName,
        saveProtonMeetPassword,
        setModel,
        setProcessState,
    ]);

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
    }, [createVideoConferenceMeeting, history, location]);

    const setup = useCallback(async () => {
        if (!model.conferenceId || !model.conferenceUrl) {
            return;
        }

        const { meetingId, urlPassword } = parseMeetingLink(model.conferenceUrl);

        if (!meetingId) {
            return;
        }

        const { privateKey } = await getMeetingDependencies();

        const meeting = await getProtonMeetByLinkName(meetingId);

        const passphrase = await getPassphraseFromEncryptedPassword({
            encryptedPassword: meeting?.Password as string,
            basePassword: urlPassword,
            privateKey,
        });

        setMeetingDetails({
            id: meetingId ?? '',
            passwordBase: urlPassword,
            passphrase,
        });

        setMeetingObject(meeting as Meeting);
    }, [getProtonMeet, getMeetingDependencies, model.conferenceId, model.conferenceUrl]);

    useEffect(() => {
        if (isActive && !meetingDetails.id && model.conferenceUrl) {
            void setup();
        }
    }, [isActive, !meetingDetails.id, model.conferenceUrl]);

    if (processState === 'meeting-present') {
        return (
            <ProtonMeetMeetingDetails
                passphrase={meetingDetails.passphrase}
                model={model}
                savePassphrase={handlePassphraseSave}
                deleteMeeting={() => {
                    setModel({
                        ...model,
                        conferenceId: '',
                        conferenceUrl: '',
                        conferenceHost: '',
                        conferenceProvider: undefined,
                        isConferenceTmpDeleted: true,
                    });

                    void deleteProtonMeet(meetingObject?.ID as string);

                    setProcessState(undefined);
                }}
            />
        );
    }

    return (
        <IconRow icon={getIcon(processState)} labelClassName={'my-auto p-0'}>
            {processState === 'loading' ? (
                <Button disabled shape="ghost" className="p-0" color="norm" size="small">
                    {c('Action').t`Adding conferencing details`}
                </Button>
            ) : (
                <div className="flex items-center gap-1">
                    <Button
                        onClick={createVideoConferenceMeeting}
                        disabled={false}
                        loading={false}
                        shape="underline"
                        className="p-0"
                        color="norm"
                        size="small"
                    >
                        {c('Action').t`Join with ${MEET_APP_NAME}`}
                    </Button>
                </div>
            )}
        </IconRow>
    );
};

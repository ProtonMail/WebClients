import { Router } from 'react-router-dom';

import { act, renderHook } from '@testing-library/react';
import { createBrowserHistory } from 'history';

import { useApi } from '@proton/components';
import { useCreateMeeting } from '@proton/meet/hooks/useCreateMeeting';
import { getPassphraseFromEncryptedPassword } from '@proton/meet/utils/cryptoUtils';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { VIDEO_CONFERENCE_PROVIDER } from '@proton/shared/lib/interfaces/calendar';
import type { EventModel } from '@proton/shared/lib/interfaces/calendar/Event';

import { useProtonMeetIntegration } from './useProtonMeetIntegration';

jest.mock('@proton/components', () => ({
    useApi: jest.fn().mockReturnValue(jest.fn()),
    useNotifications: jest.fn().mockReturnValue({
        createNotification: jest.fn(),
    }),
}));

jest.mock('../videoConferencing/useVideoConfTelemetry', () => {
    const original = jest.requireActual('../videoConferencing/useVideoConfTelemetry');

    return {
        ...original,
        useVideoConfTelemetry: jest.fn().mockReturnValue({
            sentEventProtonMeet: jest.fn(),
        }),
    };
});

jest.mock('@proton/account/user/hooks', () => ({
    useUser: jest.fn().mockReturnValue([
        {
            Email: 'test@proton.me',
        },
    ]),
}));

jest.mock('@proton/unleash', () => ({
    useFlag: jest.fn().mockReturnValue(true),
}));

jest.mock('@proton/meet/hooks/useGetMeetingDependencies', () => ({
    useGetMeetingDependencies: jest.fn().mockReturnValue(
        jest.fn().mockResolvedValue({
            dependencies: [],
        })
    ),
}));

jest.mock('@proton/meet/hooks/useCreateMeeting', () => ({
    useCreateMeeting: jest.fn().mockReturnValue({ createMeeting: jest.fn() }),
}));

jest.mock('@proton/meet/hooks/useMeetingUpdates', () => ({
    useMeetingUpdates: jest.fn().mockReturnValue({
        saveMeetingName: jest.fn(),
        saveMeetingPassword: jest.fn(),
    }),
}));

jest.mock('@proton/meet/hooks/useGetMeetingByLinkName', () => ({
    useGetMeetingByLinkName: jest.fn().mockReturnValue({
        getMeetingByLinkName: jest.fn(),
    }),
}));

jest.mock('@proton/meet/utils/cryptoUtils', () => ({
    getPassphraseFromEncryptedPassword: jest.fn(),
    decryptSessionKey: jest.fn().mockResolvedValue('session-key'),
    encryptMeetingName: jest.fn().mockResolvedValue('encrypted-title'),
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <Router history={createBrowserHistory()}>{children}</Router>;
};

const defaultProps = {
    model: { attendees: [{ email: 'test@proton.me' }] } as EventModel,
    setModel: jest.fn(),
    setActiveProvider: jest.fn(),
    isActive: false,
    setIsVideoConferenceLoading: jest.fn(),
};

const password = 'testpassword';

const meetingLink = `/join/id-abcdefgh#pwd-${password}`;

const mockProtonMeetVideoConference = {
    ID: '123',
    URL: meetingLink,
    Password: '123',
};

describe('useProtonMeetIntegration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should allow for creating a new Meet video conference', async () => {
        const mockApi = jest.fn().mockReturnValue(
            Promise.resolve({
                VideoConference: mockProtonMeetVideoConference,
            })
        );

        jest.mocked(useApi).mockReturnValueOnce(mockApi);

        const createMeeting = jest.fn().mockResolvedValue({
            meetingLink,
            id: mockProtonMeetVideoConference.ID,
            meeting: mockProtonMeetVideoConference,
        });

        jest.mocked(useCreateMeeting).mockReturnValue({
            createMeeting,
        });

        jest.mocked(getPassphraseFromEncryptedPassword).mockResolvedValue({
            passphrase: '',
            password,
        });

        const setActiveProvider = jest.fn();
        const setModel = jest.fn();

        const { result } = renderHook(
            () => useProtonMeetIntegration({ ...defaultProps, setActiveProvider, setModel }),
            {
                wrapper: Wrapper,
            }
        );

        await act(async () => {
            await result.current.createVideoConferenceMeeting();
        });

        expect(setActiveProvider).toHaveBeenCalledWith(VIDEO_CONFERENCE_PROVIDER.PROTON_MEET);

        expect(setModel).toHaveBeenCalledWith(
            expect.objectContaining({
                conferenceId: mockProtonMeetVideoConference.ID,
                conferenceUrl: getAppHref(meetingLink, APPS.PROTONMEET),
            })
        );
    });

    it('should readd a temporary deleted Proton Meet video conference', async () => {
        const mockApi = jest.fn();

        jest.mocked(useApi).mockReturnValueOnce(mockApi);

        const setActiveProvider = jest.fn();
        const setModel = jest.fn();

        const { result } = renderHook(
            () =>
                useProtonMeetIntegration({
                    ...defaultProps,
                    model: {
                        ...defaultProps.model,
                        isConferenceTmpDeleted: true,
                        conferenceUrl: meetingLink,
                        conferenceId: mockProtonMeetVideoConference.ID,
                    },
                    setActiveProvider,
                    setModel,
                }),
            {
                wrapper: Wrapper,
            }
        );

        await act(async () => {
            await result.current.createVideoConferenceMeeting();
        });

        expect(mockApi).not.toHaveBeenCalled();

        expect(setActiveProvider).toHaveBeenCalledWith(VIDEO_CONFERENCE_PROVIDER.PROTON_MEET);

        expect(setModel).toHaveBeenCalledWith(
            expect.objectContaining({
                conferenceId: mockProtonMeetVideoConference.ID,
                conferenceUrl: getAppHref(meetingLink, APPS.PROTONMEET),
            })
        );
    });
});

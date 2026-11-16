import { Router } from 'react-router-dom';

import { act, renderHook } from '@testing-library/react';
import { createBrowserHistory } from 'history';

import { useApi } from '@proton/app-context/useApi';
import { useCreateMeeting } from '@proton/meet/hooks/useCreateMeeting';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { VIDEO_CONFERENCE_PROVIDER } from '@proton/shared/lib/interfaces/calendar/Api';
import type { EventModel } from '@proton/shared/lib/interfaces/calendar/Event';

import { useProtonMeetIntegration } from './useProtonMeetIntegration';

vi.mock('@proton/app-context/useApi', () => ({
    useApi: vi.fn().mockReturnValue(vi.fn()),
}));

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: vi.fn().mockReturnValue({
        createNotification: vi.fn(),
    }),
}));

vi.mock('../videoConferencing/useVideoConfTelemetry', async () => {
    const original = await vi.importActual<Record<string, unknown>>('../videoConferencing/useVideoConfTelemetry');

    return {
        ...original,
        useVideoConfTelemetry: vi.fn().mockReturnValue({
            sentEventProtonMeet: vi.fn(),
        }),
    };
});

vi.mock('@proton/account/user/hooks', () => ({
    useUser: vi.fn().mockReturnValue([
        {
            Email: 'test@proton.me',
        },
    ]),
}));

vi.mock('@proton/account/addresses/hooks', () => ({
    useAddresses: vi.fn().mockReturnValue([[{ ID: 'address-id', Email: 'test@proton.me' }], false]),
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: vi.fn().mockReturnValue(true),
}));

vi.mock('@proton/meet/hooks/useGetMeetingDependencies', () => ({
    useGetMeetingDependencies: vi.fn().mockReturnValue(
        vi.fn().mockResolvedValue({
            dependencies: [],
        })
    ),
}));

vi.mock('@proton/meet/hooks/useCreateMeeting', () => ({
    useCreateMeeting: vi.fn().mockReturnValue({ createMeeting: vi.fn() }),
}));

vi.mock('@proton/meet/hooks/useMeetingUpdates', () => ({
    useMeetingUpdates: vi.fn().mockReturnValue({
        saveMeetingName: vi.fn(),
        saveMeetingSchedule: vi.fn(),
    }),
}));

vi.mock('@proton/meet/hooks/useGetMeetingByLinkName', () => ({
    useGetMeetingByLinkName: vi.fn().mockReturnValue({
        getMeetingByLinkName: vi.fn(),
    }),
}));

vi.mock('@proton/meet/utils/cryptoUtils', () => ({
    decryptSessionKey: vi.fn().mockResolvedValue('session-key'),
    encryptMeetingName: vi.fn().mockResolvedValue('encrypted-title'),
}));

vi.mock('./useAutoAddMeetLinkNotification', () => ({
    useAutoAddMeetLinkNotification: vi.fn().mockReturnValue({
        showAutoAddNotification: vi.fn(),
        handleDisableAutoAddMeetLink: vi.fn(),
        isDisabling: false,
        canAutoAddMeeting: false,
    }),
}));

vi.mock('./useMeetFunnelTelemetry', () => ({
    useMeetFunnelTelemetry: vi.fn().mockReturnValue({
        sendSpotlightDisplayed: vi.fn(),
        sendExploreMeetClicked: vi.fn(),
        sendMeetingCreated: vi.fn(),
    }),
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <Router history={createBrowserHistory()}>{children}</Router>;
};

const defaultProps = {
    model: {
        attendees: [{ email: 'test@proton.me' }],
        member: {
            addressID: 'address-id',
        },
    } as EventModel,
    setModel: vi.fn(),
    setActiveProvider: vi.fn(),
    isActive: false,
    setIsVideoConferenceLoading: vi.fn(),
};

const password = 'testpassword';

const meetingLink = `/join/id-abcdefghij#pwd-${password}`;

const mockProtonMeetVideoConference = {
    ID: '123',
    URL: meetingLink,
    Password: '123',
};

describe('useProtonMeetIntegration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should allow for creating a new Meet video conference', async () => {
        const mockApi = vi.fn().mockReturnValue(
            Promise.resolve({
                VideoConference: mockProtonMeetVideoConference,
            })
        );

        vi.mocked(useApi).mockReturnValueOnce(mockApi);

        const createMeeting = vi.fn().mockResolvedValue({
            meetingLink,
            id: mockProtonMeetVideoConference.ID,
            meeting: mockProtonMeetVideoConference,
        });

        vi.mocked(useCreateMeeting).mockReturnValue({
            createMeeting,
        });

        const setActiveProvider = vi.fn();
        const setModel = vi.fn();

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

    it('should read a temporary deleted Proton Meet video conference', async () => {
        const mockApi = vi.fn();

        vi.mocked(useApi).mockReturnValueOnce(mockApi);

        const setActiveProvider = vi.fn();
        const setModel = vi.fn();

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

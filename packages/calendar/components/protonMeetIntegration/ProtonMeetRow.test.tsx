import { Router } from 'react-router-dom';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createBrowserHistory } from 'history';

import { NotificationsProvider } from '@proton/components';
import { useGetMeetingByLinkName } from '@proton/meet';
import { useCreateMeeting } from '@proton/meet/hooks/useCreateMeeting';
import { useMeetingUpdates } from '@proton/meet/hooks/useMeetingUpdates';
import { getPassphraseFromEncryptedPassword } from '@proton/meet/utils/cryptoUtils';
import { type EventModel, VIDEO_CONFERENCE_PROVIDER } from '@proton/shared/lib/interfaces/calendar';

import { calendarUrlQueryParams } from '../../constants';
import {
    VideoConferenceProtonMeetIntegration,
    useVideoConfTelemetry,
} from '../videoConferencing/useVideoConfTelemetry';
import { ProtonMeetRow } from './ProtonMeetRow';
import { useProtonMeetIntegration } from './useProtonMeetIntegration';

jest.mock('@proton/components/hooks/drawer/useDrawer', () => ({
    __esModule: true,
    default: jest.fn().mockReturnValue({
        isDrawerApp: false,
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

jest.mock('@proton/account/organization/hooks', () => ({
    useOrganization: jest.fn().mockReturnValue([
        {
            Settings: { MeetVideoConferencingEnabled: true },
        },
    ]),
}));

const mockModel = {
    title: 'Test Meeting',
    attendees: [],
};

const password = 'testpassword';

const meetingLink = `/join/id-abcdefgh#pwd-${password}`;

const modelWithMeeting = {
    ...mockModel,
    conferenceUrl: `https://meet.proton.me${meetingLink}`,
    conferenceId: 'abcdefgh',
    conferenceHost: 'test@proton.me',
};

const mockMeeting = {
    ID: 'encrypted-id',
    Name: mockModel.title,
    Password: password,
};

describe('ProtonMeetRow', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const WrappedProtonMeetRow = ({
        model,
        isActive,
        setModel = jest.fn(),
    }: {
        model: EventModel;
        setModel: (model: EventModel) => void;
        isActive: boolean;
    }) => {
        const protonMeetIntegration = useProtonMeetIntegration({
            model,
            setModel,
            isActive,
            setActiveProvider: jest.fn(),
            setIsVideoConferenceLoading: jest.fn(),
        });

        return <ProtonMeetRow model={model} {...protonMeetIntegration} />;
    };

    const renderProtonMeetRow = (params?: {
        model?: Partial<EventModel>;
        setModel?: (model: EventModel) => void;
        location?: Partial<Location>;
        isActive?: boolean;
    }) => {
        const { location = {} } = params ?? {};

        const history = createBrowserHistory();

        if (location) {
            history.push(location);
        }

        const renderComponent = (renderComponentParams?: typeof params) => {
            const props = {
                model: mockModel,
                setModel: jest.fn(),
                location: {},
                isActive: false,
                ...params,
                ...renderComponentParams,
            };

            if (props.location) {
                history.push(props.location);
            }

            return (
                <NotificationsProvider>
                    <Router history={history}>
                        {/* @ts-expect-error - partial mock */}
                        <WrappedProtonMeetRow {...props} />
                    </Router>
                </NotificationsProvider>
            );
        };

        const { rerender: originalRerender, ...rest } = render(renderComponent());

        const rerender = (newParams?: typeof params) => {
            return originalRerender(renderComponent(newParams));
        };

        return { rerender, ...rest };
    };

    it('should render a button to add a meeting', () => {
        renderProtonMeetRow({ isActive: false });

        expect(screen.getByText('Join with Proton Meet')).toBeInTheDocument();
    });

    it('should allow for rendering the meeting details if it already exists', async () => {
        (useGetMeetingByLinkName as jest.Mock).mockReturnValue({
            getMeetingByLinkName: jest.fn().mockResolvedValue(mockMeeting),
        });

        (getPassphraseFromEncryptedPassword as jest.Mock).mockReturnValue({ passphrase: '' });

        renderProtonMeetRow({ model: modelWithMeeting, isActive: true });

        const user = userEvent.setup();

        expect(screen.getByText('Join with Proton Meet')).toBeInTheDocument();

        await user.click(screen.getByText('More details'));

        expect(screen.getByText('Add secret passphrase')).toBeInTheDocument();

        expect(screen.getByText(modelWithMeeting.conferenceHost)).toBeInTheDocument();
        expect(screen.getByText(modelWithMeeting.conferenceUrl)).toBeInTheDocument();
    });

    it('should allow for updating the passphrase', async () => {
        const saveMeetingPassword = jest.fn();

        const passphrase = 'passphrase';

        const setModel = jest.fn();

        (useMeetingUpdates as jest.Mock).mockReturnValue({
            saveMeetingPassword,
        });

        (useGetMeetingByLinkName as jest.Mock).mockReturnValue({
            getMeetingByLinkName: jest.fn().mockResolvedValue(mockMeeting),
        });

        (getPassphraseFromEncryptedPassword as jest.Mock).mockReturnValue({ passphrase: '' });

        renderProtonMeetRow({ model: modelWithMeeting, isActive: true, setModel });

        const user = userEvent.setup();

        await user.click(screen.getByText('More details'));

        await user.click(screen.getByText('Add secret passphrase'));

        await user.type(screen.getByPlaceholderText('Enter passphrase'), passphrase);

        await user.click(screen.getByText('Save'));

        expect(saveMeetingPassword).toHaveBeenCalledWith(
            expect.objectContaining({
                id: mockMeeting.ID,
                passwordBase: password,
                passphrase,
            })
        );

        expect(setModel).toHaveBeenCalledWith(
            expect.objectContaining({
                encryptedTitle: 'encrypted-title',
            })
        );
    });

    it('should automatically create a meeting when having the Proton Meet video conference provider in the url', async () => {
        const createMeeting = jest.fn().mockResolvedValue({
            meetingLink: `https://meet.proton.me${meetingLink}`,
            id: 'abcdefgh',
            meeting: mockMeeting,
        });

        (useCreateMeeting as jest.Mock).mockReturnValue({
            createMeeting,
        });

        const sentEventProtonMeet = jest.fn();

        (useVideoConfTelemetry as jest.Mock).mockReturnValue({
            sentEventProtonMeet,
        });

        renderProtonMeetRow({
            model: mockModel,
            location: {
                search: `?${calendarUrlQueryParams.videoConferenceProvider}=${VIDEO_CONFERENCE_PROVIDER.PROTON_MEET}`,
            },
            isActive: false,
        });

        expect(createMeeting).toHaveBeenCalled();

        await waitFor(() => {
            expect(sentEventProtonMeet).toHaveBeenCalledWith(VideoConferenceProtonMeetIntegration.create_proton_meet);
        });
    });

    it('should not automatically create a meeting when not having the Proton Meet video conference provider in the url', () => {
        const createMeeting = jest.fn().mockResolvedValue(mockMeeting);

        (useCreateMeeting as jest.Mock).mockReturnValue({
            createMeeting,
        });

        renderProtonMeetRow({ model: mockModel });

        expect(createMeeting).not.toHaveBeenCalled();
    });

    it('should automatically create a meeting when having a newly added attendee', async () => {
        const createMeeting = jest.fn().mockResolvedValue(mockMeeting);

        (useCreateMeeting as jest.Mock).mockReturnValue({
            createMeeting,
        });

        const { rerender } = renderProtonMeetRow({ model: mockModel });

        const modelWithAttendee = {
            ...mockModel,
            attendees: [{ email: 'attendee@proton.me' }],
        };

        // @ts-expect-error - partial mock
        rerender({ model: modelWithAttendee });

        expect(createMeeting).toHaveBeenCalled();

        await waitFor(() => {
            expect(screen.getByText('Join with Proton Meet')).toBeInTheDocument();
        });
    });
});

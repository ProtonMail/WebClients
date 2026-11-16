import { act, renderHook, waitFor } from '@testing-library/react';

import { useUser } from '@proton/account/user/hooks';
import { OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { useApi } from '@proton/app-context/useApi';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import { createZoomMeeting } from '@proton/shared/lib/api/calendars';
import { VIDEO_CONFERENCE_PROVIDER } from '@proton/shared/lib/interfaces/calendar/Api';
import type { EventModel } from '@proton/shared/lib/interfaces/calendar/Event';

import { useZoomIntegration } from './useZoomIntegration';

vi.mock('@proton/account/user/hooks', () => ({
    useUser: vi.fn(() => [{ hasPaidMail: true, Email: 'test@proton.me' }, false]),
}));

vi.mock('@proton/account/addresses/hooks', () => ({
    useAddresses: vi.fn(() => [[{ ID: 'address-id', Email: 'test@proton.me' }], false]),
}));

vi.mock('./useZoomOAuth', () => ({
    useZoomOAuth: vi.fn(() => ({
        loadingConfig: false,
        triggerZoomOAuth: vi.fn(),
    })),
}));

vi.mock('@proton/activation/src/logic/oauthToken/hooks', () => ({
    useOAuthToken: vi.fn(() => [[{ Provider: OAUTH_PROVIDER.ZOOM }], false]),
}));

vi.mock('@proton/components/components/modalTwo/useModalState', () => ({
    useModalStateObject: vi.fn(() => ({})),
}));

vi.mock('@proton/app-context/useApi', () => ({
    useApi: vi.fn(() => ({})),
}));

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: vi.fn(() => ({})),
}));

vi.mock('../videoConferencing/useVideoConfTelemetry', async () => ({
    VideoConferenceZoomIntegration: vi.fn(),
    useVideoConfTelemetry: vi.fn(() => ({
        sentEventZoom: vi.fn(),
    })),
}));

const defaultProps = {
    hasZoomError: false,
    model: {
        member: {
            addressID: 'address-id',
        },
    } as EventModel,
    setModel: vi.fn(),
    onRowClick: vi.fn(),
    setActiveProvider: vi.fn(),
};

const mockZoomVideoConference = {
    ID: '123',
    URL: 'https://zoom.us/j/123',
    Password: '123',
};

describe('useZoomIntegration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should allow for creating a Zoom video conference if the user has paid mail', async () => {
        const mockApi = vi.fn().mockReturnValue(
            Promise.resolve({
                VideoConference: mockZoomVideoConference,
            })
        );

        vi.mocked(useApi).mockReturnValue(mockApi);

        const setActiveProvider = vi.fn();
        const setModel = vi.fn();

        const { result } = renderHook(() => useZoomIntegration({ ...defaultProps, setActiveProvider, setModel }));

        await act(async () => {
            await result.current.handleClick();
        });

        expect(setActiveProvider).toHaveBeenCalledWith(VIDEO_CONFERENCE_PROVIDER.ZOOM);

        expect(mockApi).toHaveBeenCalledWith(expect.objectContaining(createZoomMeeting()));

        expect(setModel).toHaveBeenCalledWith({
            ...defaultProps.model,
            conferenceId: mockZoomVideoConference.ID,
            conferenceUrl: mockZoomVideoConference.URL,
            conferencePassword: mockZoomVideoConference.Password,
            conferenceHost: 'test@proton.me',
            conferenceProvider: VIDEO_CONFERENCE_PROVIDER.ZOOM,
            isConferenceTmpDeleted: false,
        });
    });

    it('should not allow for creating a Zoom video conference if the user does not have paid mail', async () => {
        const mockApi = vi.fn();

        vi.mocked(useApi).mockReturnValue(mockApi);

        const mockZoomUpsellModal = {
            openModal: vi.fn(),
        };
        // @ts-expect-error - only mocking the relevant properties
        vi.mocked(useModalStateObject).mockReturnValue(mockZoomUpsellModal);

        // @ts-expect-error - only mocking the relevant properties
        vi.mocked(useUser).mockReturnValueOnce([{ hasPaidMail: false, Email: 'test@proton.me' }, false]);

        const { result } = renderHook(() => useZoomIntegration(defaultProps));

        await act(async () => {
            await result.current.handleClick();
        });

        expect(mockApi).not.toHaveBeenCalled();

        expect(mockZoomUpsellModal.openModal).toHaveBeenCalled();
    });

    it('should read the temporary deleted Zoom video conference', async () => {
        const mockApi = vi.fn();

        vi.mocked(useApi).mockReturnValue(mockApi);

        const setActiveProvider = vi.fn();
        const setModel = vi.fn();

        const { result } = renderHook(() =>
            useZoomIntegration({
                ...defaultProps,
                // @ts-expect-error - only mocking the relevant properties
                model: {
                    member: defaultProps.model.member,
                    isConferenceTmpDeleted: true,
                    conferenceUrl: mockZoomVideoConference.URL,
                    conferenceId: mockZoomVideoConference.ID,
                    conferencePassword: mockZoomVideoConference.Password,
                    conferenceProvider: VIDEO_CONFERENCE_PROVIDER.ZOOM,
                },
                setActiveProvider,
                setModel,
            })
        );

        await act(async () => {
            await result.current.handleClick();
        });

        expect(mockApi).not.toHaveBeenCalled();

        await waitFor(() => {
            expect(setActiveProvider).toHaveBeenCalledWith(VIDEO_CONFERENCE_PROVIDER.ZOOM);

            expect(setModel).toHaveBeenCalledWith({
                ...defaultProps.model,
                conferenceId: mockZoomVideoConference.ID,
                conferenceUrl: mockZoomVideoConference.URL,
                conferencePassword: mockZoomVideoConference.Password,
                conferenceProvider: VIDEO_CONFERENCE_PROVIDER.ZOOM,
                isConferenceTmpDeleted: false,
            });
        });
    });
});

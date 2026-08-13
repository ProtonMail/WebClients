import { act, renderHook, waitFor } from '@testing-library/react';

import { useUser } from '@proton/account/user/hooks';
import { OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { useApi, useModalStateObject } from '@proton/components';
import { createZoomMeeting } from '@proton/shared/lib/api/calendars';
import { VIDEO_CONFERENCE_PROVIDER } from '@proton/shared/lib/interfaces/calendar/Api';
import type { EventModel } from '@proton/shared/lib/interfaces/calendar/Event';

import { useZoomIntegration } from './useZoomIntegration';

jest.mock('@proton/account/user/hooks', () => ({
    useUser: jest.fn(() => [{ hasPaidMail: true, Email: 'test@proton.me' }, false]),
}));

jest.mock('@proton/account/addresses/hooks', () => ({
    useAddresses: jest.fn(() => [[{ ID: 'address-id', Email: 'test@proton.me' }], false]),
}));

jest.mock('./useZoomOAuth', () => ({
    useZoomOAuth: jest.fn(() => ({
        loadingConfig: false,
        triggerZoomOAuth: jest.fn(),
    })),
}));

jest.mock('@proton/activation/index', () => ({
    useOAuthToken: jest.fn(() => [[{ Provider: OAUTH_PROVIDER.ZOOM }], false]),
}));

jest.mock('@proton/components', () => ({
    useApi: jest.fn(() => ({})),
    useModalStateObject: jest.fn(() => ({})),
    useNotifications: jest.fn(() => ({})),
}));

jest.mock('../videoConferencing/useVideoConfTelemetry', () => ({
    VideoConferenceZoomIntegration: jest.fn(),
    useVideoConfTelemetry: jest.fn(() => ({
        sentEventZoom: jest.fn(),
    })),
}));

const defaultProps = {
    hasZoomError: false,
    model: {
        member: {
            addressID: 'address-id',
        },
    } as EventModel,
    setModel: jest.fn(),
    onRowClick: jest.fn(),
    setActiveProvider: jest.fn(),
};

const mockZoomVideoConference = {
    ID: '123',
    URL: 'https://zoom.us/j/123',
    Password: '123',
};

describe('useZoomIntegration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should allow for creating a Zoom video conference if the user has paid mail', async () => {
        const mockApi = jest.fn().mockReturnValue(
            Promise.resolve({
                VideoConference: mockZoomVideoConference,
            })
        );

        jest.mocked(useApi).mockReturnValue(mockApi);

        const setActiveProvider = jest.fn();
        const setModel = jest.fn();

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
        const mockApi = jest.fn();

        jest.mocked(useApi).mockReturnValue(mockApi);

        const mockZoomUpsellModal = {
            openModal: jest.fn(),
        };
        // @ts-expect-error - only mocking the relevant properties
        jest.mocked(useModalStateObject).mockReturnValue(mockZoomUpsellModal);

        // @ts-expect-error - only mocking the relevant properties
        jest.mocked(useUser).mockReturnValueOnce([{ hasPaidMail: false, Email: 'test@proton.me' }, false]);

        const { result } = renderHook(() => useZoomIntegration(defaultProps));

        await act(async () => {
            await result.current.handleClick();
        });

        expect(mockApi).not.toHaveBeenCalled();

        expect(mockZoomUpsellModal.openModal).toHaveBeenCalled();
    });

    it('should read the temporary deleted Zoom video conference', async () => {
        const mockApi = jest.fn();

        jest.mocked(useApi).mockReturnValue(mockApi);

        const setActiveProvider = jest.fn();
        const setModel = jest.fn();

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

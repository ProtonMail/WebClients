import { render } from '@testing-library/react';

import { SEPARATOR_PROTON_EVENTS } from '@proton/calendar/videoConferencing/constants';
import { useVideoConferencingWidget } from '@proton/calendar/videoConferencing/widget';
import type { EventModelReadView, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { calendarBuilder } from '@proton/testing/lib/builders';

import PopoverEventContent from './PopoverEventContent';

jest.mock('@proton/calendar/videoConferencing/widget', () => ({
    useVideoConferencingWidget: jest.fn(),
}));

jest.mock('@proton/components/containers/contacts/ContactEmailsProvider', () => ({
    useContactEmailsCache: () => ({ contactEmailsMap: {} }),
}));

jest.mock('@proton/components/containers/contacts/hooks/useContactModals', () => ({
    useContactModals: () => ({ modals: null, onDetails: jest.fn(), onEdit: jest.fn() }),
}));

const mockedUseVideoConferencingWidget = useVideoConferencingWidget as jest.Mock;

const ZOOM_URL = 'https://us05web.zoom.us/j/88128811438?pwd=tXBwNj7tnajHLftxrqTkU4DtS2M7Au.1';
// A description with the embedded video conference block, as produced by addVideoConfInfoToDescription
const EMBEDDED_BLOCK = `\n${SEPARATOR_PROTON_EVENTS}\nJoin Zoom Meeting: ${ZOOM_URL} (ID: 88128811438, passcode: 4qNpNK)\n${SEPARATOR_PROTON_EVENTS}`;
const DESCRIPTION_WITH_BLOCK = `Team standup notes${EMBEDDED_BLOCK}`;

const WIDGET_SENTINEL = 'VIDEO_CONF_WIDGET_SENTINEL';

const renderContent = (model: EventModelReadView) =>
    render(
        <PopoverEventContent
            calendar={calendarBuilder() as VisualCalendar}
            model={model}
            formatTime={() => ''}
            displayNameEmailMap={{}}
            isDrawerApp={false}
        />
    );

// EventModelReadView is a large type without a dedicated builder; we cast the subset the component reads, as the
// neighbouring useVideoConferencingWidget test does.
const buildModel = (description: string): EventModelReadView =>
    ({
        description,
        location: '',
        organizer: undefined,
        attendees: [],
        isOrganizer: false,
        selfAddress: undefined,
        notifications: [],
    }) as unknown as EventModelReadView;

describe('PopoverEventContent video conference description', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('keeps the embedded block in the description when the widget is not displayed', () => {
        // The video conference link could not be parsed into a widget (e.g. unsupported provider)
        mockedUseVideoConferencingWidget.mockReturnValue(null);

        const { container } = renderContent(buildModel(DESCRIPTION_WITH_BLOCK));

        expect(container.textContent).toContain('Team standup notes');
        expect(container.textContent).toContain('Join Zoom Meeting');
        expect(container.textContent).toContain('passcode: 4qNpNK');
        expect(container.textContent).not.toContain(WIDGET_SENTINEL);
    });

    it('strips the embedded block from the description when the widget is displayed', () => {
        // The widget renders the meeting details, so they must be removed from the description to avoid duplication
        mockedUseVideoConferencingWidget.mockReturnValue(<div>{WIDGET_SENTINEL}</div>);

        const { container } = renderContent(buildModel(DESCRIPTION_WITH_BLOCK));

        expect(container.textContent).toContain(WIDGET_SENTINEL);
        expect(container.textContent).toContain('Team standup notes');
        expect(container.textContent).not.toContain('Join Zoom Meeting');
        expect(container.textContent).not.toContain('passcode: 4qNpNK');
        expect(container.textContent).not.toContain(SEPARATOR_PROTON_EVENTS);
    });

    it('renders no description row when the description is only the embedded block and the widget is displayed', () => {
        mockedUseVideoConferencingWidget.mockReturnValue(<div>{WIDGET_SENTINEL}</div>);

        const { container, queryByText } = renderContent(buildModel(EMBEDDED_BLOCK));

        expect(container.textContent).toContain(WIDGET_SENTINEL);
        expect(container.textContent).not.toContain('Join Zoom Meeting');
        expect(queryByText('Description')).not.toBeInTheDocument();
    });
});

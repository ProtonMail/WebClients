import { fireEvent, screen } from '@testing-library/dom';

import useAvailableAddresses from '@proton/activation/src/hooks/useAvailableAddresses';
import type { ImporterCalendar } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.interface';
import { selectOauthImportStateImporterData } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector';
import { generateMockAddressArray } from '@proton/activation/src/tests/data/addresses';
import { prepareState } from '@proton/activation/src/tests/data/prepareState';
import { easySwitchRender } from '@proton/activation/src/tests/render';
import type { ModalStateProps } from '@proton/components';
import { CALENDAR_DISPLAY, CALENDAR_TYPE } from '@proton/shared/lib/calendar/constants';
import type { CalendarMember, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import CustomizeCalendarImportModal from './CustomizeCalendarImportModal';
import type { DerivedCalendarType } from './useCustomizeCalendarImportModal';

const modalProps: ModalStateProps = {
    open: true,
    onClose: () => {},
    onExit: () => {},
};

const calendarMember: CalendarMember = {
    ID: 'id',
    CalendarID: 'CalendarID',
    AddressID: 'AddressID',
    Flags: 1,
    Name: 'Name',
    Description: 'Description',
    Email: 'Email',
    Permissions: 1,
    Color: 'Color',
    Display: CALENDAR_DISPLAY.VISIBLE,
    Priority: 1,
};

const visualCalendar: VisualCalendar = {
    Owner: { Email: 'testing@proton.ch' },
    Members: [calendarMember],
    ID: 'id',
    Type: CALENDAR_TYPE.PERSONAL,
    Name: 'visualCalendar',
    Description: 'visualCalendar',
    Color: 'visualCalendar',
    Display: CALENDAR_DISPLAY.VISIBLE,
    Email: 'testing@proton.ch',
    Flags: 1,
    Permissions: 1,
    Priority: 1,
};

const importerCalendar: ImporterCalendar = {
    source: 'testing',
    description: 'testing',
    id: 'testing',
    checked: true,
};

const derivedValuesNoErrors: DerivedCalendarType = {
    selectedCalendars: [importerCalendar],
    calendarsToBeCreatedCount: 1,
    calendarLimitReached: false,
    selectedCalendarsCount: 1,
    disabled: false,
    calendarsToFixCount: 0,
    canMerge: true,
    totalCalendarsCount: 10,
    calendarsToBeMergedCount: 2,
};

jest.mock('@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector', () => ({
    ...jest.requireActual('@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector'),
    selectOauthImportStateImporterData: jest.fn(),
}));

const addresses = generateMockAddressArray(3, true);
const mockUseAddressValue = {
    availableAddresses: addresses,
    loading: false,
    defaultAddress: addresses[0],
};

jest.mock('@proton/activation/src/hooks/useAvailableAddresses');
const mockUseAvailableAddresses = useAvailableAddresses as jest.MockedFunction<any>;

const mockSelectorImporterData = selectOauthImportStateImporterData as any as jest.Mock<
    ReturnType<typeof selectOauthImportStateImporterData>
>;

describe('CustomizeCalendarImportModal', () => {
    it('Should render customize calendar modal', () => {
        mockUseAvailableAddresses.mockReturnValue(mockUseAddressValue);
        mockSelectorImporterData.mockImplementation(() => prepareState.mailImport?.importerData);

        const standardProps = {
            modalProps,
            providerCalendarsState: [importerCalendar],
            derivedValues: derivedValuesNoErrors,
            activeWritableCalendars: [visualCalendar],
            handleSubmit: () => {},
            handleCalendarToggle: () => {},
            handleMappingChange: () => {},
        };

        easySwitchRender(<CustomizeCalendarImportModal {...standardProps} />);
        screen.getByTestId('CustomizeCalendarImportModal:description');
    });

    it('Should render calendar limit reached', () => {
        mockUseAvailableAddresses.mockReturnValue(mockUseAddressValue);
        mockSelectorImporterData.mockImplementation(() => prepareState.mailImport?.importerData);

        const derivedValuesWithErrors = { ...derivedValuesNoErrors, calendarLimitReached: true };
        const standardProps = {
            modalProps,
            providerCalendarsState: [importerCalendar],
            derivedValues: derivedValuesWithErrors,
            activeWritableCalendars: [visualCalendar],
            handleSubmit: () => {},
            handleCalendarToggle: () => {},
            handleMappingChange: () => {},
        };

        easySwitchRender(<CustomizeCalendarImportModal {...standardProps} />);
        screen.getByTestId('CustomizeCalendarImportModalLimitReached:container');
    });

    it('Should render different elements if cannot merge', () => {
        mockUseAvailableAddresses.mockReturnValue(mockUseAddressValue);
        mockSelectorImporterData.mockImplementation(() => prepareState.mailImport?.importerData);

        const derivedValuesNoMerge = { ...derivedValuesNoErrors, canMerge: false };
        const standardProps = {
            modalProps,
            providerCalendarsState: [importerCalendar],
            derivedValues: derivedValuesNoMerge,
            activeWritableCalendars: [visualCalendar],
            handleSubmit: () => {},
            handleCalendarToggle: () => {},
            handleMappingChange: () => {},
        };

        easySwitchRender(<CustomizeCalendarImportModal {...standardProps} />);
        screen.getByTestId('CustomizeCalendarImportModal:description');
    });

    it('Should click the checkbox of a calendar', () => {
        mockUseAvailableAddresses.mockReturnValue(mockUseAddressValue);
        mockSelectorImporterData.mockImplementation(() => prepareState.mailImport?.importerData);

        const standardProps = {
            modalProps,
            providerCalendarsState: [importerCalendar],
            derivedValues: derivedValuesNoErrors,
            activeWritableCalendars: [visualCalendar],
            handleSubmit: () => {},
            handleCalendarToggle: () => {},
            handleMappingChange: () => {},
        };

        easySwitchRender(<CustomizeCalendarImportModal {...standardProps} />);

        const checkboxes = screen.getAllByTestId('CustomizeCalendarImportRow:checkbox');
        expect(checkboxes).toHaveLength(standardProps.providerCalendarsState.length);
        fireEvent.click(checkboxes[0]);
    });
});

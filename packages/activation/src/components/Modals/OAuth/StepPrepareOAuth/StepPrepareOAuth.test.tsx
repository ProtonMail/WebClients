import { screen } from '@testing-library/dom';

import { ApiMailImporterFolder } from '@proton/activation/src/api/api.interface';
import MailImportFoldersParser from '@proton/activation/src/helpers/MailImportFoldersParser/MailImportFoldersParser';
import { ImportType, MailImportDestinationFolder, TIME_PERIOD } from '@proton/activation/src/interface';
import { selectOauthImportStateImporterData } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector';
import { mockAddresses } from '@proton/activation/src/tests/data/addresses';
import { prepareState } from '@proton/activation/src/tests/data/prepareState';
import { easySwitchRender } from '@proton/activation/src/tests/render';

import { MailImportFields } from '../../CustomizeMailImportModal/CustomizeMailImportModal.interface';
import StepPrepare from './StepPrepareOAuth';
import useStepPrepare from './hooks/useStepPrepareOAuth';
import useStepPrepareEmailSummary from './hooks/useStepPrepareOAuthEmailSummary';

jest.mock('./hooks/useStepPrepareOAuth', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('./hooks/useStepPrepareOAuthEmailSummary', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector', () => ({
    ...jest.requireActual('@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector'),
    selectOauthImportStateImporterData: jest.fn(),
}));

const isLabelMapping = false;
const simpleProviderFolders: ApiMailImporterFolder[] = [
    {
        Source: 'New Name',
        Separator: '/',
        Size: 10,
        Flags: [],
    },
];

const simpleFields: MailImportFields = {
    mapping: new MailImportFoldersParser(simpleProviderFolders, isLabelMapping).folders,
    importLabel: { Color: '#fff', Name: 'label', Type: 1 },
    importPeriod: TIME_PERIOD.LAST_MONTH,
    importAddress: mockAddresses[0],
    importCategoriesDestination: MailImportDestinationFolder.INBOX,
};

const emailSummary = {
    fields: simpleFields,
    errors: [],
    summary: '',
    toEmail: '',
    handleSubmitCustomizeModal: () => {},
};

const mockedUseStepPrepare = useStepPrepare as jest.Mock<ReturnType<typeof useStepPrepare>>;
const mockedUseStepPrepareEmailSummary = useStepPrepareEmailSummary as jest.Mock<
    ReturnType<typeof useStepPrepareEmailSummary>
>;
const mockSelectorImporterData = selectOauthImportStateImporterData as any as jest.Mock<
    ReturnType<typeof selectOauthImportStateImporterData>
>;

describe('StepPrepare test the product display, only selected products should be displayed', () => {
    const defaultStepPrepare = {
        products: [ImportType.CALENDAR, ImportType.CONTACTS, ImportType.MAIL],
        mailChecked: true,
        setMailChecked: () => {},
        contactChecked: true,
        setContactChecked: () => {},
        calendarChecked: true,
        setCalendarChecked: () => {},
        importerData: prepareState.mailImport!.importerData!,
        handleCancel: () => {},
        handleSubmit: () => {},
        emailTitle: 'title',
        hasErrors: false,
        enabledFeatures: {
            isEmailsEnabled: true,
            isContactsEnabled: true,
            isCalendarsEnabled: true,
        },
        allCheckboxUnselected: false,
    };

    it('Should render all products', () => {
        mockSelectorImporterData.mockImplementation(() => prepareState.mailImport?.importerData);
        mockedUseStepPrepare.mockImplementation(() => defaultStepPrepare);
        mockedUseStepPrepareEmailSummary.mockImplementation(() => emailSummary);

        easySwitchRender(<StepPrepare />);

        screen.getByTestId('StepPrepareEmailsSummary:summary');
        screen.getByTestId('StepPrepareContactsSummary:summary');
        screen.getByTestId('StepPrepareCalendarSummary:summary');
    });

    it('Should render only email product', () => {
        const emailState = { ...defaultStepPrepare, products: [ImportType.MAIL] };
        mockedUseStepPrepare.mockImplementation(() => emailState);
        mockedUseStepPrepareEmailSummary.mockImplementation(() => emailSummary);

        easySwitchRender(<StepPrepare />);

        screen.getByTestId('StepPrepareEmailsSummary:summary');
        expect(screen.queryByTestId('StepPrepareContactsSummary:summary')).toBeNull();
        expect(screen.queryByTestId('StepPrepareCalendarSummary:summary')).toBeNull();
    });

    it('Should render only contact product', () => {
        const emailState = { ...defaultStepPrepare, products: [ImportType.CONTACTS] };
        mockedUseStepPrepare.mockImplementation(() => emailState);
        mockedUseStepPrepareEmailSummary.mockImplementation(() => emailSummary);

        easySwitchRender(<StepPrepare />);

        expect(screen.queryByTestId('StepPrepareEmailsSummary:summary')).toBeNull();
        screen.getByTestId('StepPrepareContactsSummary:summary');
        expect(screen.queryByTestId('StepPrepareCalendarSummary:summary')).toBeNull();
    });

    it('Should render only calendar product', () => {
        const emailState = { ...defaultStepPrepare, products: [ImportType.CALENDAR] };
        mockedUseStepPrepare.mockImplementation(() => emailState);
        mockedUseStepPrepareEmailSummary.mockImplementation(() => emailSummary);

        easySwitchRender(<StepPrepare />);

        expect(screen.queryByTestId('StepPrepareEmailsSummary:summary')).toBeNull();
        expect(screen.queryByTestId('StepPrepareContactsSummary:summary')).toBeNull();
        screen.getByTestId('StepPrepareCalendarSummary:summary');
    });
});

describe('Render errors on products', () => {
    const defaultStepPrepare = {
        products: [ImportType.CALENDAR, ImportType.CONTACTS, ImportType.MAIL],
        mailChecked: true,
        setMailChecked: () => {},
        contactChecked: true,
        setContactChecked: () => {},
        calendarChecked: true,
        setCalendarChecked: () => {},
        importerData: prepareState.mailImport!.importerData!,
        handleCancel: () => {},
        handleSubmit: () => {},
        emailTitle: 'title',
        hasErrors: false,
        enabledFeatures: {
            isEmailsEnabled: true,
            isContactsEnabled: true,
            isCalendarsEnabled: true,
        },
        allCheckboxUnselected: false,
    };

    it('Should render error box if an error is present', () => {
        const stepPrepareWithError = { ...defaultStepPrepare, hasErrors: true };
        mockSelectorImporterData.mockImplementation(() => prepareState.mailImport?.importerData);
        mockedUseStepPrepare.mockImplementation(() => stepPrepareWithError);
        mockedUseStepPrepareEmailSummary.mockImplementation(() => emailSummary);

        easySwitchRender(<StepPrepare />);

        screen.getByTestId('StepPrepareErrorBox:container');
    });

    it('should disable the submit button if all checkboxes are unchecked', () => {
        const noCheckboxSelected = {
            ...defaultStepPrepare,
            mailChecked: false,
            contactChecked: false,
            calendarChecked: false,
            allCheckboxUnselected: true,
        };

        mockSelectorImporterData.mockImplementation(() => prepareState.mailImport?.importerData);
        mockedUseStepPrepare.mockImplementation(() => noCheckboxSelected);
        mockedUseStepPrepareEmailSummary.mockImplementation(() => emailSummary);

        easySwitchRender(<StepPrepare />);
        const submitButton = screen.getByText('Start import');
        expect(submitButton).toBeDisabled();
    });
});

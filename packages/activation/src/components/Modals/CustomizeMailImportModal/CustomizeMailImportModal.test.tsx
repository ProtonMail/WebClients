import { fireEvent, screen, waitFor } from '@testing-library/dom';

import { ApiMailImporterFolder } from '@proton/activation/src/api/api.interface';
import MailImportFoldersParser from '@proton/activation/src/helpers/MailImportFoldersParser/MailImportFoldersParser';
import { MailImportDestinationFolder, TIME_PERIOD } from '@proton/activation/src/interface';
import { easySwitchRender } from '@proton/activation/src/tests/render';
import { ModalStateProps } from '@proton/components';
import { ADDRESS_STATUS, ADDRESS_TYPE } from '@proton/shared/lib/constants';
import { Address } from '@proton/shared/lib/interfaces';

import CustomizeMailImportModal from './CustomizeMailImportModal';
import { MailImportFields } from './CustomizeMailImportModal.interface';

const address: Address = {
    DisplayName: 'Testing',
    DomainID: 'proton.ch',
    Email: 'testing@proton.ch',
    HasKeys: 1,
    ID: 'ID',
    Keys: [],
    SignedKeyList: null,
    Order: 1,
    Priority: 1,
    Receive: 1,
    Send: 1,
    Signature: 'Testing signature',
    Status: ADDRESS_STATUS.STATUS_ENABLED,
    Type: ADDRESS_TYPE.TYPE_ORIGINAL,
    ProtonMX: false,
};

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
    importAddress: address,
    importCategoriesDestination: MailImportDestinationFolder.INBOX,
};

const providerFolderWithError: ApiMailImporterFolder[] = [
    {
        Source: 'Scheduled',
        Separator: '/',
        Size: 10,
        Flags: [],
    },
];

const getModalProps = (): ModalStateProps => {
    const key = new Date();
    return {
        key: key.getTime().toString(),
        open: true,
        onClose: () => {},
        onExit: () => {},
    };
};

describe('Customize modal tests', () => {
    it('Should display the customize folder modal and close it with save button', () => {
        easySwitchRender(
            <CustomizeMailImportModal
                foldersOpened={false}
                fields={simpleFields}
                importedEmail="test@proton.ch"
                isLabelMapping={false}
                onSubmit={() => {}}
                displayCategories={false}
                modalProps={getModalProps()}
            />
        );

        const saveButton = screen.getByTestId('CustomizeModal:modalSave');
        fireEvent.click(saveButton);
    });

    it('Should display the customize folder modal and close it with cancel button', () => {
        easySwitchRender(
            <CustomizeMailImportModal
                foldersOpened={false}
                fields={simpleFields}
                importedEmail="test@proton.ch"
                isLabelMapping={false}
                onSubmit={() => {}}
                displayCategories={false}
                modalProps={getModalProps()}
            />
        );

        const cancelButton = screen.getByTestId('CustomizeModal:modalCancel');
        fireEvent.click(cancelButton);
    });

    it('Should display the customize folder modal', () => {
        easySwitchRender(
            <CustomizeMailImportModal
                foldersOpened={false}
                fields={simpleFields}
                importedEmail="test@proton.ch"
                isLabelMapping={false}
                onSubmit={() => {}}
                displayCategories={false}
                modalProps={getModalProps()}
            />
        );

        screen.getByTestId('CustomizeModal:folderHeader');

        // Display folders
        const showFolderButton = screen.getByTestId('CustomizeModal:toggleFolders');
        fireEvent.click(showFolderButton);
        screen.getByTestId('CustomizeModal:destinationItem');

        // Toggle folder checkbox
        const checkboxes = screen.getAllByTestId('CustomizeModal:checkbox');
        fireEvent.click(checkboxes[0]);
        fireEvent.click(checkboxes[0]);

        // Close folders
        fireEvent.click(showFolderButton);
        expect(screen.queryByTestId('CustomizeModal:destinationItem')).toBeNull();

        // Open and close the edit label modal
        const editLabelButton = screen.getByTestId('CustomizeModal:editLabel');
        fireEvent.click(editLabelButton);
        screen.getByTestId('label-modal');
        const editLabelCloseButton = screen.getByTestId('label-modal:cancel');
        fireEvent.click(editLabelCloseButton);

        // Change default time period
        const select = screen.getByText('Last month only');
        fireEvent.click(select);
        fireEvent.click(screen.getByText('Last 3 months only'));

        // Close modal and expect confirmation modal and close it
        const cancelButton = screen.getByTestId('CustomizeModal:modalCancel');
        fireEvent.click(cancelButton);
        screen.getByTestId('CancelModal:container');
        const closeModal = screen.getByTestId('CancelModal:cancel');
        fireEvent.click(closeModal);

        // Click again the cancel button but cancel the changes this time
        fireEvent.click(cancelButton);
        const quitModal = screen.getByTestId('CancelModal:quit');
        fireEvent.click(quitModal);
    });

    it('Should display the customize label modal', async () => {
        const onSubmit = jest.fn();

        easySwitchRender(
            <CustomizeMailImportModal
                foldersOpened={false}
                fields={simpleFields}
                importedEmail="test@proton.ch"
                isLabelMapping={true}
                displayCategories={true}
                onSubmit={onSubmit}
                modalProps={getModalProps()}
            />
        );

        screen.getByTestId('CustomizeModal:labelHeader');

        const showFolderButton = screen.getByTestId('CustomizeModal:toggleFolders');
        fireEvent.click(showFolderButton);
        screen.getByTestId('CustomizeModal:destinationItem');
        fireEvent.click(showFolderButton);
        expect(screen.queryByTestId('CustomizeModal:destinationItem')).toBeNull();

        // Expect to see gmail categories
        screen.getByTestId('CustomizeModal:gmailCategories');

        // Change the Gmail category
        const select = screen.getByText('Move to Inbox');
        fireEvent.click(select);
        fireEvent.click(screen.getByText('Move to Archive'));

        // Submit the change and verify the new payload
        const modalSave = screen.getByTestId('CustomizeModal:modalSave');
        fireEvent.click(modalSave);
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit).toHaveBeenCalledWith({
            ...simpleFields,
            importCategoriesDestination: MailImportDestinationFolder.ARCHIVE,
        });
    });

    it('Should display an error if folder is reserved and save buttons should be disabled', () => {
        const fields: MailImportFields = {
            mapping: new MailImportFoldersParser(providerFolderWithError, isLabelMapping).folders,
            importLabel: { Color: '#fff', Name: 'label', Type: 1 },
            importPeriod: TIME_PERIOD.LAST_MONTH,
            importAddress: address,
            importCategoriesDestination: MailImportDestinationFolder.ALL_DRAFTS,
        };
        const onSubmit = jest.fn();

        easySwitchRender(
            <CustomizeMailImportModal
                foldersOpened={true}
                fields={fields}
                importedEmail="test@proton.ch"
                isLabelMapping={false}
                displayCategories={false}
                onSubmit={onSubmit}
                modalProps={getModalProps()}
            />
        );

        const input = screen.getByDisplayValue('Scheduled');
        const rowSave = screen.getAllByTestId('CustomizeModal:rowSave');
        const modalSave = screen.getByTestId('CustomizeModal:modalSave');
        expect(input).toBeInvalid();
        expect(modalSave).toBeDisabled();
        rowSave.every((item) => expect(item).toBeDisabled());

        fireEvent.click(modalSave);
        rowSave.forEach((item) => fireEvent.click(item));

        expect(onSubmit).toHaveBeenCalledTimes(0);
    });

    it('Should remove error if error is fixed and save buttons should be enabled', async () => {
        const fields: MailImportFields = {
            mapping: new MailImportFoldersParser(providerFolderWithError, isLabelMapping).folders,
            importLabel: { Color: '#fff', Name: 'label', Type: 1 },
            importPeriod: TIME_PERIOD.LAST_MONTH,
            importAddress: address,
            importCategoriesDestination: MailImportDestinationFolder.ALL_DRAFTS,
        };

        const onSubmit = jest.fn();

        easySwitchRender(
            <CustomizeMailImportModal
                foldersOpened={true}
                fields={fields}
                importedEmail="test@proton.ch"
                isLabelMapping={false}
                displayCategories={false}
                onSubmit={onSubmit}
                modalProps={getModalProps()}
            />
        );

        const input = screen.getByDisplayValue('Scheduled');
        const rowSave = screen.getAllByTestId('CustomizeModal:rowSave');
        const modalSave = screen.getByTestId('CustomizeModal:modalSave');
        expect(modalSave).toBeDisabled();
        expect(input).toBeInvalid();
        rowSave.every((item) => expect(item).toBeDisabled());

        fireEvent.click(modalSave);
        rowSave.forEach((item) => {
            fireEvent.click(item);
        });

        expect(onSubmit).toHaveBeenCalledTimes(0);

        // Fix the error by changing input and click the buttons again
        fireEvent.change(input, { target: { value: 'New Name' } });

        await waitFor(() => expect(input).toBeValid());
        rowSave.every((item) => expect(item).toBeEnabled());

        rowSave.forEach((item) => {
            fireEvent.click(item);
        });
        expect(modalSave).toBeEnabled();

        fireEvent.click(modalSave);
        expect(onSubmit).toHaveBeenCalledTimes(1);
        // Update initial mapping to have the new folder name
        const newMapping = fields.mapping;
        newMapping[0].protonPath = ['New Name'];
        expect(onSubmit).toHaveBeenCalledWith({ ...fields, mapping: newMapping });
    });

    it('Should update the payload when the selected period changes', () => {
        const onSubmit = jest.fn();

        easySwitchRender(
            <CustomizeMailImportModal
                foldersOpened={false}
                fields={simpleFields}
                importedEmail="test@proton.ch"
                isLabelMapping={false}
                displayCategories={false}
                onSubmit={onSubmit}
                modalProps={getModalProps()}
            />
        );

        const select = screen.getByText('Last month only');
        const rowSave = screen.queryAllByTestId('CustomizeModal:rowSave');
        const modalSave = screen.getByTestId('CustomizeModal:modalSave');
        expect(rowSave.length).toBe(0);

        fireEvent.click(select);
        fireEvent.click(screen.getByText('Last 3 months only'));

        fireEvent.click(modalSave);

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit).toHaveBeenCalledWith({ ...simpleFields, importPeriod: TIME_PERIOD.LAST_3_MONTHS });
    });

    it('Should display warning when cancelling changes in modal', () => {
        const onSubmit = jest.fn();

        easySwitchRender(
            <CustomizeMailImportModal
                foldersOpened={false}
                fields={simpleFields}
                importedEmail="test@proton.ch"
                isLabelMapping={false}
                displayCategories={false}
                onSubmit={onSubmit}
                modalProps={getModalProps()}
            />
        );

        const select = screen.getByText('Last month only');
        const rowSave = screen.queryAllByTestId('CustomizeModal:rowSave');
        const modalCancel = screen.getByTestId('CustomizeModal:modalCancel');
        expect(rowSave.length).toBe(0);

        fireEvent.click(select);
        fireEvent.click(screen.getByText('Last 3 months only'));
        fireEvent.click(modalCancel);

        screen.getByTestId('CancelModal:container');
    });

    it('Should indent folders in source and destination', () => {
        const providerFolders = [
            'Parent',
            'Parent/Children',
            'Parent/Children/SubChildren',
            'Parent/Children/SubChildren/FinalChildren',
        ].map(
            (source) =>
                ({
                    Source: source,
                    Separator: '/',
                } as ApiMailImporterFolder)
        );

        const nestedFields: MailImportFields = {
            mapping: new MailImportFoldersParser(providerFolders, isLabelMapping).folders,
            importLabel: { Color: '#fff', Name: 'label', Type: 1 },
            importPeriod: TIME_PERIOD.LAST_MONTH,
            importAddress: address,
            importCategoriesDestination: MailImportDestinationFolder.ALL_DRAFTS,
        };

        const onSubmit = jest.fn();

        easySwitchRender(
            <CustomizeMailImportModal
                foldersOpened={true}
                fields={nestedFields}
                importedEmail="test@proton.ch"
                isLabelMapping={false}
                displayCategories={false}
                onSubmit={onSubmit}
                modalProps={getModalProps()}
            />
        );

        const sourceItems = screen.getAllByTestId('CustomizeModal:sourceItem');
        sourceItems.every((item, index) => {
            expect(item).toHaveStyle(`--ml-custom: ${index + 1}em`);
        });

        const destinationItem = screen.getAllByTestId('CustomizeModal:destinationItem');
        destinationItem.forEach((item, index) => {
            if (index < 3) {
                expect(item).toHaveStyle(`--ml-custom: ${index + 1}em`);
            } else {
                expect(item).toHaveStyle('--ml-custom: 3em');
            }
        });
    });

    it('Should display destinationFolder name instead of source in proton import column', () => {
        const providerFolders = [
            {
                Source: 'INBOX',
                Separator: '/',
                DestinationFolder: 'Inbox',
            } as ApiMailImporterFolder,
            {
                Source: '[Gmail]/Sent Mail',
                Separator: '/',
                DestinationFolder: 'Sent',
            } as ApiMailImporterFolder,
            {
                Source: '[Gmail]/Drafts',
                Separator: '/',
                DestinationFolder: 'Drafts',
            } as ApiMailImporterFolder,
        ];
        const nestedFields: MailImportFields = {
            mapping: new MailImportFoldersParser(providerFolders, isLabelMapping).folders,
            importLabel: { Color: '#fff', Name: 'label', Type: 1 },
            importPeriod: TIME_PERIOD.LAST_MONTH,
            importAddress: address,
            importCategoriesDestination: MailImportDestinationFolder.ALL_DRAFTS,
        };

        const onSubmit = jest.fn();

        easySwitchRender(
            <CustomizeMailImportModal
                foldersOpened={true}
                fields={nestedFields}
                importedEmail="test@proton.ch"
                isLabelMapping={true}
                displayCategories={false}
                onSubmit={onSubmit}
                modalProps={getModalProps()}
            />
        );

        expect(screen.getAllByTestId('CustomizeModal:FolderRow:providerName').map((node) => node.textContent)).toEqual([
            'INBOX',
            '[Gmail]/Sent Mail',
            '[Gmail]/Drafts',
        ]);
        expect(screen.getAllByTestId('CustomizeModal:FolderRow:protonName').map((node) => node.textContent)).toEqual([
            'Inbox',
            'Sent',
            'Drafts',
        ]);
    });
});

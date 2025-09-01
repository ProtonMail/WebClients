import { fireEvent, screen } from '@testing-library/dom';

import { MailImportPayloadError } from '@proton/activation/src/interface';
import { easySwitchRender } from '@proton/activation/src/tests/render';

import ManageFolderRowInput from './ManageFoldersRowInput';

describe('ManageFoldersRowInput', () => {
    it('Should not display error', () => {
        easySwitchRender(
            <ManageFolderRowInput
                disabled={false}
                errors={[]}
                handleChange={jest.fn}
                handleSave={jest.fn}
                hasError={false}
                inputValue={''}
                inputRef={null}
                isLabelMapping={false}
            />
        );
    });

    it('Should display too long error', async () => {
        easySwitchRender(
            <ManageFolderRowInput
                disabled={false}
                errors={[MailImportPayloadError.FOLDER_NAMES_TOO_LONG]}
                handleChange={jest.fn}
                handleSave={jest.fn}
                hasError={true}
                inputValue={'Testing'}
                inputRef={null}
                isLabelMapping={false}
            />
        );

        await screen.findByText('The folder name is too long. Please choose a different name.');
    });

    it('Should display too unavailable name error', async () => {
        easySwitchRender(
            <ManageFolderRowInput
                disabled={false}
                errors={[MailImportPayloadError.UNAVAILABLE_NAMES]}
                handleChange={jest.fn}
                handleSave={jest.fn}
                hasError={true}
                inputValue={'Testing'}
                inputRef={null}
                isLabelMapping={false}
            />
        );

        await screen.findByText('This folder name is not available. Please choose a different name.');
    });

    it('Should display too non empty name error', async () => {
        easySwitchRender(
            <ManageFolderRowInput
                disabled={false}
                errors={[MailImportPayloadError.EMPTY]}
                handleChange={jest.fn}
                handleSave={jest.fn}
                hasError={true}
                inputValue={'Testing'}
                inputRef={null}
                isLabelMapping={false}
            />
        );

        await screen.findByText('Folder name cannot be empty.');
    });

    it('Should display too reserved name error', async () => {
        easySwitchRender(
            <ManageFolderRowInput
                disabled={false}
                errors={[MailImportPayloadError.RESERVED_NAMES]}
                handleChange={jest.fn}
                handleSave={jest.fn}
                hasError={true}
                inputValue={'Testing'}
                inputRef={null}
                isLabelMapping={false}
            />
        );

        await screen.findByText('The folder name is invalid. Please choose a different name.');
    });

    it('Should run save method when enter is pressed', async () => {
        const handleSave = jest.fn();

        easySwitchRender(
            <ManageFolderRowInput
                disabled={false}
                errors={[]}
                handleChange={jest.fn}
                handleSave={handleSave}
                hasError={false}
                inputValue={'Testing'}
                inputRef={null}
                isLabelMapping={false}
            />
        );

        const input = await screen.getByDisplayValue('Testing');
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

        expect(handleSave).toHaveBeenCalledTimes(1);
    });

    it('Should not run save method when enter is pressed and component has error', async () => {
        const handleSave = jest.fn();

        easySwitchRender(
            <ManageFolderRowInput
                disabled={false}
                errors={[MailImportPayloadError.EMPTY]}
                handleChange={jest.fn}
                handleSave={handleSave}
                hasError={true}
                inputValue={'Testing'}
                inputRef={null}
                isLabelMapping={false}
            />
        );

        const input = await screen.getByDisplayValue('Testing');
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

        expect(handleSave).toHaveBeenCalledTimes(0);
    });
});

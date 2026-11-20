import { act, fireEvent, waitFor, within } from '@testing-library/react';

import { AttachmentAction } from '@proton/mail-composer/attachments/attachmentListTypes';
import type { PendingUpload } from '@proton/mail-composer/attachments/uploadTypes';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';

import { clearAll } from '../../../../helpers/tests/helper';
import { mailTestRender } from '../../../../helpers/tests/render';
import AttachmentItem from './AttachmentItem';

const archive = { ID: 'ID1', Name: 'archive.zip', MIMEType: 'application/zip', Size: 10 } as Attachment;

describe('AttachmentItem', () => {
    afterEach(() => clearAll());

    it('should download only once when every control of the chip is clicked during a download', async () => {
        let resolveDownload: () => void = () => {};
        const download = jest.fn(
            () =>
                new Promise<void>((resolve) => {
                    resolveDownload = resolve;
                })
        );

        const { getByTestId } = await mailTestRender(
            <AttachmentItem
                attachment={archive}
                primaryAction={AttachmentAction.Download}
                secondaryAction={AttachmentAction.Download}
                onPrimary={download}
                onSecondary={download}
            />
        );

        const primary = getByTestId('attachment-item:archive.zip--primary-action');
        const secondary = getByTestId('attachment-item:archive.zip--secondary-action');

        fireEvent.click(secondary);
        expect(secondary).toBeDisabled();
        fireEvent.click(primary);
        fireEvent.click(secondary);

        expect(download).toHaveBeenCalledTimes(1);

        await act(async () => resolveDownload());
        await waitFor(() => expect(secondary).toBeEnabled());

        fireEvent.click(primary);
        expect(download).toHaveBeenCalledTimes(2);
    });

    it('should keep the download loader visible for fast downloads', async () => {
        const download = jest.fn(() => Promise.resolve());

        const { getByTestId } = await mailTestRender(
            <AttachmentItem
                attachment={archive}
                primaryAction={AttachmentAction.Download}
                secondaryAction={AttachmentAction.Download}
                onPrimary={download}
                onSecondary={download}
            />
        );

        const secondary = getByTestId('attachment-item:archive.zip--secondary-action');
        fireEvent.click(secondary);

        // The download itself resolved immediately, the loader is still shown
        await act(async () => {});
        expect(secondary).toHaveAttribute('aria-busy', 'true');

        await waitFor(() => expect(secondary).toBeEnabled());
    });

    describe('Save to Drive', () => {
        const saveToDriveName = 'Save archive.zip to Proton Drive';
        const noop = () => Promise.resolve();

        it('shows no Save to Drive button without a save handler', async () => {
            const { queryByRole } = await mailTestRender(
                <AttachmentItem
                    attachment={archive}
                    primaryAction={AttachmentAction.Preview}
                    secondaryAction={AttachmentAction.Download}
                    onPrimary={noop}
                    onSecondary={noop}
                />
            );

            expect(queryByRole('button', { name: saveToDriveName })).toBe(null);
        });

        it('shows a Save to Drive button named after the file, before the download button', async () => {
            const { getByRole, getByTestId } = await mailTestRender(
                <AttachmentItem
                    attachment={archive}
                    primaryAction={AttachmentAction.Preview}
                    secondaryAction={AttachmentAction.Download}
                    onPrimary={noop}
                    onSecondary={noop}
                    onSaveToDrive={noop}
                />
            );

            const saveToDrive = getByRole('button', { name: saveToDriveName });
            const download = getByTestId('attachment-item:archive.zip--secondary-action');

            expect(saveToDrive.compareDocumentPosition(download)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
        });

        it('shows the Save to Proton Drive tooltip when the Save to Drive button has focus', async () => {
            const { getByRole, findByText } = await mailTestRender(
                <AttachmentItem
                    attachment={archive}
                    primaryAction={AttachmentAction.Preview}
                    secondaryAction={AttachmentAction.Download}
                    onPrimary={noop}
                    onSecondary={noop}
                    onSaveToDrive={noop}
                />
            );

            act(() => getByRole('button', { name: saveToDriveName }).focus());

            await findByText('Save to Proton Drive');
        });

        it('shows no Save to Drive button on a file that is still uploading', async () => {
            const pendingUpload = { file: new File(['x'], 'archive.zip'), isDummy: true } as PendingUpload;

            const { getByTestId, queryByRole } = await mailTestRender(
                <AttachmentItem
                    pendingUpload={pendingUpload}
                    primaryAction={AttachmentAction.Preview}
                    secondaryAction={AttachmentAction.Remove}
                    onPrimary={noop}
                    onSecondary={noop}
                    onSaveToDrive={noop}
                />
            );

            getByTestId('attachment-item:archive.zip--secondary-action');
            expect(queryByRole('button', { name: saveToDriveName })).toBe(null);
        });

        const deferred = () => {
            let resolve: () => void = () => {};
            const promise = new Promise<void>((resolvePromise) => {
                resolve = resolvePromise;
            });
            return { promise, resolve: () => resolve() };
        };

        const renderWithSave = async ({
            onPrimary = jest.fn(noop),
            onSecondary = jest.fn(noop),
            onSaveToDrive = jest.fn(noop),
        }: {
            onPrimary?: jest.Mock;
            onSecondary?: jest.Mock;
            onSaveToDrive?: jest.Mock;
        }) => {
            const view = await mailTestRender(
                <AttachmentItem
                    attachment={archive}
                    primaryAction={AttachmentAction.Preview}
                    secondaryAction={AttachmentAction.Download}
                    onPrimary={onPrimary}
                    onSecondary={onSecondary}
                    onSaveToDrive={onSaveToDrive}
                />
            );

            const saveToDrive = view.getByRole('button', { name: saveToDriveName });

            return {
                ...view,
                saveToDrive,
                download: view.getByTestId('attachment-item:archive.zip--secondary-action'),
                primary: view.getByTestId('attachment-item:archive.zip--primary-action'),
                zone: saveToDrive.closest('.message-attachmentSecondaryAction'),
                chip: view.getByTestId('attachment-item').firstElementChild,
            };
        };

        it('shows the loader on Save to Drive, keeps the download arrow and disables download and the name while saving', async () => {
            const save = deferred();
            const { saveToDrive, download, primary, zone, chip } = await renderWithSave({
                onSaveToDrive: jest.fn(() => save.promise),
            });

            fireEvent.click(saveToDrive);

            expect(within(saveToDrive).getByTestId('circle-loader')).toBeInTheDocument();
            within(download).getByText('Download archive.zip');
            expect(download).toBeDisabled();
            expect(primary).toHaveAttribute('aria-disabled', 'true');
            expect(zone).toHaveAttribute('aria-busy', 'true');
            expect(chip).toHaveClass('message-attachmentList-item--loading');

            await act(async () => save.resolve());
            await waitFor(() => expect(download).toBeEnabled());
        });

        it('ignores download and preview clicks while saving', async () => {
            const save = deferred();
            const onPrimary = jest.fn(noop);
            const onSecondary = jest.fn(noop);
            const { saveToDrive, download, primary } = await renderWithSave({
                onPrimary,
                onSecondary,
                onSaveToDrive: jest.fn(() => save.promise),
            });

            fireEvent.click(saveToDrive);
            fireEvent.click(download);
            fireEvent.click(primary);

            expect(onSecondary).not.toHaveBeenCalled();
            expect(onPrimary).not.toHaveBeenCalled();

            await act(async () => save.resolve());
            await waitFor(() => expect(download).toBeEnabled());

            fireEvent.click(download);
            expect(onSecondary).toHaveBeenCalledTimes(1);
        });

        it('ignores Save to Drive while a download runs', async () => {
            const downloading = deferred();
            const onSaveToDrive = jest.fn(noop);
            const { saveToDrive, download, zone } = await renderWithSave({
                onSecondary: jest.fn(() => downloading.promise),
                onSaveToDrive,
            });

            fireEvent.click(download);
            fireEvent.click(saveToDrive);

            expect(onSaveToDrive).not.toHaveBeenCalled();
            expect(zone).toHaveAttribute('aria-busy', 'true');

            await act(async () => downloading.resolve());
            await waitFor(() => expect(saveToDrive).toBeEnabled());

            fireEvent.click(saveToDrive);
            expect(onSaveToDrive).toHaveBeenCalledTimes(1);
        });

        it('keeps the saving loader visible for fast saves', async () => {
            const { saveToDrive } = await renderWithSave({});

            fireEvent.click(saveToDrive);

            // The save itself resolved immediately, the loader is still shown
            await act(async () => {});
            expect(within(saveToDrive).getByTestId('circle-loader')).toBeInTheDocument();

            await waitFor(() => expect(saveToDrive).toBeEnabled());
        });
    });
});

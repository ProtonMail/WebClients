import { act, fireEvent, waitFor } from '@testing-library/react';

import { AttachmentAction } from '@proton/mail-composer/attachments/attachmentListTypes';
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
});

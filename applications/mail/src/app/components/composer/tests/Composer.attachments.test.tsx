import { fireEvent } from '@testing-library/dom';
import { clearAll, render, tick } from '../../../helpers/test/helper';
import Composer from '../Composer';
import { ID, props, prepareMessage } from './Composer.test.helpers';

jest.setTimeout(20000);

// Prevent the actual encrypt and upload attachment
jest.mock('../../../helpers/attachment/attachmentUploader', () => {
    return {
        ATTACHMENT_ACTION: {
            ATTACHMENT: 'attachment',
            INLINE: 'inline',
        },
        upload: () => [
            {
                resultPromise: new Promise(() => {
                    // empty
                }),
                addProgressListener: () => {
                    // empty
                },
            },
        ],
        isSizeExceeded: () => false,
    };
});

const png = new File([], 'file.png', { type: 'image/png' });

describe('Composer attachments', () => {
    afterEach(clearAll);

    it('should not show embedded modal when plaintext mode', async () => {
        prepareMessage({ localID: ID, data: { ToList: [] } });
        const { getByTestId, queryByText } = await render(<Composer {...props} messageID={ID} />);
        const inputAttachment = getByTestId('composer-attachments-button') as HTMLInputElement;
        fireEvent.change(inputAttachment, { target: { files: [png] } });
        await tick();
        const embeddedModal = queryByText('0 image detected');
        expect(embeddedModal).toBe(null);
        // TODO: Restore that test
        // await findByText('1 file attached');
    });
});

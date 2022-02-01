import { setup } from './ViewEOMessage.test.helpers';
import { EOMessageReply } from '../../../../logic/eo/eoType';
import { EOClearAll, reply } from '../../../../helpers/test/eo/helpers';

describe('Encrypted Outside message reply', () => {
    afterEach(EOClearAll);

    it('should not be able to click on reply button if max replies has been reached', async () => {
        const { getByTestId } = await setup({ replies: [reply, reply, reply, reply, reply] as EOMessageReply[] });

        const replyButton = getByTestId('eoreply:button');
        expect(replyButton).toHaveAttribute('disabled');
    });

    it('should be able to click on reply button if max replies has not been reached', async () => {
        const { getByTestId } = await setup({ replies: [reply, reply, reply, reply] as EOMessageReply[] });

        const replyButton = getByTestId('eoreply:button');
        expect(replyButton).not.toHaveAttribute('disabled');
    });
});

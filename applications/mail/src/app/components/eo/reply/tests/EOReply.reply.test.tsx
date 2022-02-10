import { setup } from './EOReply.test.helpers';
import { EOClearAll, reply } from '../../../../helpers/test/eo/helpers';

describe('EO Reply if max replies has been reached', function () {
    afterEach(EOClearAll);

    it('should have the sending button disabled if max replies has been reached', async () => {
        const { getByTestId } = await setup({ replies: [reply, reply, reply, reply, reply] });

        const sendButton = getByTestId('send-eo');

        expect(sendButton).toHaveAttribute('disabled');
    });

    it('should have the sending button enabled if max replies has not been reached', async () => {
        const { getByTestId } = await setup({ replies: [reply, reply, reply] });

        const sendButton = getByTestId('send-eo');

        expect(sendButton).not.toHaveAttribute('disabled');
    });
});

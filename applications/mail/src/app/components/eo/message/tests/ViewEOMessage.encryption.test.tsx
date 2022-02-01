import { findByText } from '@testing-library/dom';
import { setup } from './ViewEOMessage.test.helpers';
import { getIframeRootDiv } from '../../../message/tests/Message.test.helpers';
import { EOBody, EOClearAll, EOSubject } from '../../../../helpers/test/eo/helpers';

describe('Encrypted Outside message view encryption', () => {
    afterEach(EOClearAll);

    it('should decrypt and render a EO message', async () => {
        const { getByText, container } = await setup();

        getByText(EOSubject);

        const iframeContent = await getIframeRootDiv(container);

        await findByText(iframeContent, EOBody);
    });
});

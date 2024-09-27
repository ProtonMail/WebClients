import { waitFor } from '@testing-library/react';

import { FeatureCode } from '@proton/features';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { getFeatureFlagsState } from '@proton/testing/lib/features';

import { addApiMock, clearAll, createDocument, minimalCache } from '../../../helpers/test/helper';
import type { MessageState } from '../../../store/messages/messagesTypes';
import { getIframeRootDiv, initMessage, setup as messageSetup } from './Message.test.helpers';

jest.mock('@proton/components/containers/themes/ThemeProvider', () => {
    return {
        useTheme: () => ({ information: { dark: true } }),
    };
});

describe('Message dark styles', () => {
    afterEach(clearAll);

    const setup = async (content: string) => {
        addApiMock('metrics', () => ({}));

        const document = createDocument(content);

        const message: MessageState = {
            localID: 'messageID',
            data: {
                ID: 'messageID',
            } as Message,
            messageDocument: { document },
        };

        minimalCache();

        const { store, container, rerender } = await messageSetup(
            message,
            {},
            {
                preloadedState: {
                    features: getFeatureFlagsState([[FeatureCode.DarkStylesInBody, true]]),
                },
            }
        );
        initMessage(store, message);
        await rerender();
        const iframe = await getIframeRootDiv(container);

        await waitFor(() => {
            const placeholders = container.querySelectorAll('.message-content-loading-placeholder');
            if (placeholders.length > 0) {
                throw new Error('placeholders');
            }
        });

        return iframe.classList.contains('proton-dark-style');
    };

    it('should activate dark style when no contrast issue', async () => {
        const content = `
            <div>
                <p>this is a test</p>
                <p>with no special style</p>
            </div>
        `;

        const hasDarkStyle = await setup(content);

        expect(hasDarkStyle).toBe(true);
    });

    it('should not activate dark style when a contrast issue is found', async () => {
        const content = `
            <div>
                <p>this is a test</p>
                <p style='color: #111'>with forced color</p>
            </div>
        `;

        const hasDarkStyle = await setup(content);

        expect(hasDarkStyle).toBe(false);
    });

    it('should deal with transparent backgrounds', async () => {
        const content = `
            <div>
                <p>this is a test</p>
                <p style='background: #0000'>with transparent background</p>
            </div>
        `;

        const hasDarkStyle = await setup(content);

        expect(hasDarkStyle).toBe(true);
    });

    it('should deal with forced light', async () => {
        const content = `
            <div>
                <p>this is a test</p>
                <p style='color: #fff; background: #000'>with forced light section</p>
            </div>
        `;

        const hasDarkStyle = await setup(content);

        expect(hasDarkStyle).toBe(true);
    });
});

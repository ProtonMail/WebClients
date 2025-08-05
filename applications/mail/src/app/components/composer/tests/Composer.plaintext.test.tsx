import { fireEvent, screen } from '@testing-library/react';

import type { MIME_TYPES } from '@proton/shared/lib/constants';

import { clearAll, parseDOMStringToBodyElement, waitForSpyCall } from '../../../helpers/test/helper';
import { mailTestRender } from '../../../helpers/test/render';
import * as useSaveDraft from '../../../hooks/message/useSaveDraft';
import Composer from '../Composer';
import { ID, prepareMessage, props } from './Composer.test.helpers';

jest.setTimeout(20000);

jest.mock('proton-mail/hooks/usePromise', () => ({
    usePromise: () => {
        return {
            promise: Promise.resolve(),
            resolver: jest.fn(),
            rejecter: jest.fn(),
            renew: jest.fn(),
            isPending: false,
        };
    },
}));

// In this test, switching from plaintext to html will trigger autosave
// But encryption and save requests are not the point of this test so it's easier and faster to mock that logic
jest.mock('../../../hooks/message/useSaveDraft', () => {
    const saveSpy = jest.fn(() => Promise.resolve());
    return {
        saveSpy,
        useCreateDraft: () => () => Promise.resolve(),
        useSaveDraft: () => saveSpy,
        useDeleteDraft: () => () => Promise.resolve(),
    };
});

const saveSpy = (useSaveDraft as any).saveSpy as jest.Mock;

const mockSetContent = jest.fn();
jest.mock('@proton/components/components/editor/rooster/helpers/getRoosterEditorActions', () => {
    let content = '';
    return function () {
        return {
            getContent: () => {
                return content;
            },
            setContent: (nextContent: string) => {
                content = nextContent;
                mockSetContent(nextContent);
            },
            focus: () => {},
        };
    };
});

describe('Composer switch plaintext <-> html', () => {
    beforeEach(clearAll);
    afterAll(clearAll);

    const composerID = 'composer-test-id';

    it('should switch from plaintext to html content without loosing content', async () => {
        const content = 'content';

        await mailTestRender(<Composer {...props} composerID={composerID} />, {
            onStore: (store) => {
                prepareMessage(
                    store,
                    {
                        localID: ID,
                        data: {
                            MIMEType: 'text/plain' as MIME_TYPES,
                            ToList: [],
                        },
                        messageDocument: {
                            plainText: content,
                        },
                    },
                    composerID
                );
            },
        });

        const moreOptionsButton = await screen.findByTestId('composer:more-options-button');
        fireEvent.click(moreOptionsButton);

        const toHtmlButton = await screen.findByTestId('editor-to-html');
        fireEvent.click(toHtmlButton);

        await screen.findByTestId('rooster-iframe');

        await waitForSpyCall({ spy: mockSetContent });

        expect(mockSetContent).toHaveBeenCalledWith(
            `<div style="font-family: Arial, sans-serif; font-size: 14px;">${content}</div>`
        );

        // Wait for auto save
        await waitForSpyCall({ spy: saveSpy });
    });

    it('should switch from html to plaintext content without loosing content', async () => {
        const content = `
          <div>content line 1<br><div>
          <div>content line 2<br><div>
        `;

        await mailTestRender(<Composer {...props} composerID={composerID} />, {
            onStore: (store) => {
                prepareMessage(
                    store,
                    {
                        localID: ID,
                        data: {
                            MIMEType: 'text/html' as MIME_TYPES,
                            ToList: [],
                        },
                        messageDocument: {
                            document: parseDOMStringToBodyElement(content),
                        },
                    },
                    composerID
                );
            },
        });

        const moreOptionsButton = await screen.findByTestId('composer:more-options-button');
        fireEvent.click(moreOptionsButton);

        const toHtmlButton = await screen.findByTestId('editor-to-plaintext');
        fireEvent.click(toHtmlButton);

        const textarea = (await screen.findByTestId('editor-textarea')) as HTMLTextAreaElement;

        expect(textarea.value).toBe('content line 1\ncontent line 2');

        // Wait for auto save
        await waitForSpyCall({ spy: saveSpy });
    });
});

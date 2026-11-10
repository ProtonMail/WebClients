import { fireEvent, screen } from '@testing-library/react';

import Composer from '@proton/mail-composer/components/composer/Composer';
import { parseDOMStringToBodyElement } from '@proton/mail-message/helpers/parseDOMStringToBodyElement';
import type { MessageState } from '@proton/mail-message/store/messages/messagesTypes';
import type { MIME_TYPES } from '@proton/shared/lib/constants';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';

import { addApiMock } from '../../../helpers/tests/api';
import { clearAll, waitForNotification, waitForSpyCall } from '../../../helpers/tests/helper';
import { mailTestRender } from '../../../helpers/tests/render';
import * as useSaveDraft from '../../../hooks/message/useSaveDraft';
import { ID, prepareMessage, props } from './Composer.test.helpers';

jest.setTimeout(20000);

jest.mock('@proton/mail-composer/hooks/usePromise', () => ({
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
            isDisposed: () => false,
        };
    };
});

describe('Composer switch plaintext <-> html', () => {
    beforeEach(() => {
        clearAll();
        // Switching the editor mode triggers the autosave, which is debounced for 2s.
        // Fake timers let `waitForSpyCall` skip that delay instead of waiting it out.
        jest.useFakeTimers({ advanceTimers: true });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

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

    const logo = { ID: 'logo', Name: 'logo.png', Headers: { 'content-id': '<logo@example.com>' } } as Attachment;
    const report = { ID: 'report', Name: 'report.pdf', Headers: {} } as Attachment;

    const renderWithEmbeddedImage = async () => {
        await mailTestRender(<Composer {...props} composerID={composerID} />, {
            onStore: (store) => {
                prepareMessage(
                    store,
                    {
                        localID: ID,
                        data: {
                            MIMEType: 'text/html' as MIME_TYPES,
                            ToList: [],
                            Attachments: [logo, report],
                        },
                        messageDocument: {
                            document: parseDOMStringToBodyElement(
                                '<div>content</div><img src="blob:logo" data-embedded-img="cid:logo@example.com">'
                            ),
                        },
                        messageImages: {
                            hasEmbeddedImages: true,
                            hasRemoteImages: false,
                            showEmbeddedImages: true,
                            showRemoteImages: false,
                            trackersStatus: 'loaded',
                            images: [
                                {
                                    type: 'embedded',
                                    id: 'embedded-logo',
                                    cid: 'logo@example.com',
                                    cloc: '',
                                    attachment: logo,
                                    status: 'loaded',
                                    tracker: undefined,
                                },
                            ],
                        },
                    },
                    composerID
                );
            },
        });
    };

    it('should remove the embedded images from the attachments when switching to plaintext', async () => {
        const removeSpy = jest.fn(() => ({}));
        addApiMock(`mail/v4/attachments/${logo.ID}`, removeSpy, 'delete');

        await renderWithEmbeddedImage();

        fireEvent.click(await screen.findByTestId('composer:more-options-button'));
        fireEvent.click(await screen.findByTestId('editor-to-plaintext'));
        await screen.findByTestId('editor-textarea');

        await waitForSpyCall({ spy: removeSpy });
        expect(removeSpy).toHaveBeenCalledTimes(1);
        expect(removeSpy).toHaveBeenCalledWith(expect.objectContaining({ params: { MessageID: ID } }));

        // The draft that is saved, and later sent, only keeps the other attachments
        await waitForSpyCall({ spy: saveSpy });
        const savedMessage = (saveSpy.mock.calls.at(-1) as unknown[] | undefined)?.[0] as MessageState;
        expect(savedMessage.data?.Attachments).toEqual([report]);
    });

    it('should stay in html and keep the embedded images when deleting them fails', async () => {
        const removeSpy = jest.fn(() => Promise.reject(new Error('Delete failed')));
        addApiMock(`mail/v4/attachments/${logo.ID}`, removeSpy, 'delete');

        await renderWithEmbeddedImage();

        fireEvent.click(await screen.findByTestId('composer:more-options-button'));
        fireEvent.click(await screen.findByTestId('editor-to-plaintext'));

        await waitForSpyCall({ spy: removeSpy });
        await waitForNotification('Embedded images could not be removed');
        expect(screen.queryByTestId('editor-textarea')).toBeNull();
        expect(screen.getByTestId('rooster-iframe')).toBeInTheDocument();
        expect(saveSpy).not.toHaveBeenCalled();
    });
});

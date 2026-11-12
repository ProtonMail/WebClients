import { type BeforePasteEvent, ChangeSource, type IEditor, PasteType, PluginEventType } from 'roosterjs-editor-types';

import EditorCustomPastePlugin from './EditorCustomPastePlugin';

const DEFAULT_SANITIZING_OPTIONS = {
    attributeCallbacks: {},
    additionalAllowedAttributes: [],
    additionalTagReplacements: {},
    elementCallbacks: {},
    cssStyleCallbacks: {},
    additionalAllowedCssClasses: [],
    additionalDefaultStyleValues: {},
    additionalGlobalStyleNodes: [],
    additionalPredefinedCssForElement: {},
    preserveHtmlComments: false,
    unknownTagReplacement: null,
};

const createMockSelection = (text: string) => ({
    collapsed: false,
    cloneContents: () => ({ textContent: text }),
});

describe('EditorCustomPastePlugin', () => {
    let plugin: EditorCustomPastePlugin;
    let mockEditor: Pick<IEditor, 'getSelectionRange' | 'deleteSelectedContent' | 'insertNode'>;
    let mockOnPasteFiles: jest.Mock;

    beforeEach(() => {
        mockOnPasteFiles = jest.fn();
        mockEditor = {
            getSelectionRange: jest.fn(),
            deleteSelectedContent: jest.fn(),
            insertNode: jest.fn(),
        };

        plugin = new EditorCustomPastePlugin(mockOnPasteFiles);
        plugin.initialize(mockEditor as IEditor);
    });

    const createPasteEvent = (text: string, types: string[]): BeforePasteEvent => {
        const fragment = document.createDocumentFragment();
        Object.defineProperty(fragment, 'textContent', {
            get: () => '',
            set: () => {},
        });

        return {
            eventType: PluginEventType.BeforePaste,
            clipboardData: {
                text,
                types,
                rawHtml: null,
                image: null,
                customValues: {},
            },
            fragment,
            sanitizingOption: DEFAULT_SANITIZING_OPTIONS,
            htmlBefore: '',
            htmlAfter: '',
            htmlAttributes: {},
            pasteType: PasteType.Normal,
        };
    };

    describe('handleUrlPaste', () => {
        it('should return false when no text is selected', () => {
            const event = createPasteEvent('https://example.com', ['text/plain']);
            mockEditor.getSelectionRange = jest.fn().mockReturnValue(null);
            plugin.onPluginEvent(event);
            expect(mockEditor.insertNode).not.toHaveBeenCalled();
        });

        it('should return false when pasted content is not a valid URL', () => {
            const event = createPasteEvent('not-a-url', ['text/plain']);
            mockEditor.getSelectionRange = jest.fn().mockReturnValue(createMockSelection('selected text'));
            plugin.onPluginEvent(event);
            expect(mockEditor.insertNode).not.toHaveBeenCalled();
        });

        it('should return false when URL protocol is not allowed', () => {
            const event = createPasteEvent('ftp://example.com', ['text/plain']);
            mockEditor.getSelectionRange = jest.fn().mockReturnValue(createMockSelection('selected text'));
            plugin.onPluginEvent(event);
            expect(mockEditor.insertNode).not.toHaveBeenCalled();
        });

        it('should convert selected text to link when valid URL is pasted', () => {
            const event = createPasteEvent('https://example.com', ['text/plain']);
            mockEditor.getSelectionRange = jest.fn().mockReturnValue(createMockSelection('selected text'));
            plugin.onPluginEvent(event);
            expect(mockEditor.deleteSelectedContent).toHaveBeenCalled();
            expect(mockEditor.insertNode).toHaveBeenCalledWith(
                expect.objectContaining({
                    tagName: 'A',
                    href: 'https://example.com/',
                    textContent: 'selected text',
                    target: '_blank',
                    rel: 'noopener noreferrer',
                })
            );
        });

        it('should return false when clipboard contains non plain text type', () => {
            const event = createPasteEvent('<a href="https://example.com">Link</a>', ['text/html']);
            plugin.onPluginEvent(event);
            expect(mockEditor.insertNode).not.toHaveBeenCalled();
        });
    });

    describe('images not allowed', () => {
        const isPastedImageAllowed = (image: HTMLImageElement) => !image.hasAttribute('data-embedded-img');
        const imagesHTML = '<img src="https://example.com/a.png"><img src="blob:x" data-embedded-img="cid:b">';

        const parseNodes = (html: string) =>
            Array.from(new DOMParser().parseFromString(html, 'text/html').body.childNodes);

        const createHTMLPasteEvent = (html: string): BeforePasteEvent => {
            const fragment = document.createDocumentFragment();
            fragment.append(...parseNodes(html));

            return {
                eventType: PluginEventType.BeforePaste,
                clipboardData: { text: '', types: ['text/html'], rawHtml: html, image: null, customValues: {} },
                fragment,
                sanitizingOption: { ...DEFAULT_SANITIZING_OPTIONS },
                htmlBefore: '',
                htmlAfter: '',
                htmlAttributes: {},
                pasteType: PasteType.Normal,
            };
        };

        const getSources = (root: ParentNode) =>
            Array.from(root.querySelectorAll('img')).map((image) => image.getAttribute('src'));

        it('should leave them out of the paste', () => {
            plugin = new EditorCustomPastePlugin(mockOnPasteFiles, isPastedImageAllowed);
            plugin.initialize({ ...mockEditor, addDomEventHandler: jest.fn() } as unknown as IEditor);

            const event = createHTMLPasteEvent(`<div>Text</div>${imagesHTML}`);
            plugin.onPluginEvent(event);

            expect(getSources(event.fragment)).toEqual(['https://example.com/a.png']);
            expect(event.fragment.textContent).toBe('Text');
        });

        it('should keep every image without the callback', () => {
            const event = createHTMLPasteEvent(imagesHTML);
            plugin.onPluginEvent(event);

            expect(getSources(event.fragment)).toEqual(['https://example.com/a.png', 'blob:x']);
        });

        describe('on drop', () => {
            let content: HTMLDivElement;
            let onDrop: () => void;
            let dropEditor: IEditor;

            beforeEach(() => {
                content = document.createElement('div');
                content.append(...parseNodes('<img src="blob:before" data-embedded-img="cid:before">'));
                dropEditor = {
                    ...mockEditor,
                    queryElements: jest.fn(() => Array.from(content.querySelectorAll('img'))),
                    addUndoSnapshot: jest.fn((callback: () => void) => callback()),
                    addDomEventHandler: jest.fn((_name: string, handler: () => void) => {
                        onDrop = handler;
                        return jest.fn();
                    }),
                } as unknown as IEditor;

                plugin = new EditorCustomPastePlugin(mockOnPasteFiles, isPastedImageAllowed);
                plugin.initialize(dropEditor);
            });

            const drop = (html: string) => {
                onDrop();
                content.append(...parseNodes(html));
                plugin.onPluginEvent({
                    eventType: PluginEventType.ContentChanged,
                    source: ChangeSource.Drop,
                });
            };

            it('should remove the dropped images only', () => {
                drop(imagesHTML);

                expect(getSources(content)).toEqual(['blob:before', 'https://example.com/a.png']);
                expect(dropEditor.addUndoSnapshot).toHaveBeenCalledTimes(1);
            });

            it('should not change the content when every dropped image is allowed', () => {
                drop('<img src="https://example.com/a.png">');

                expect(getSources(content)).toEqual(['blob:before', 'https://example.com/a.png']);
                expect(dropEditor.addUndoSnapshot).not.toHaveBeenCalled();
            });

            it('should not remove anything on a content change that does not follow a drop', () => {
                plugin.onPluginEvent({ eventType: PluginEventType.ContentChanged, source: ChangeSource.Drop });

                expect(getSources(content)).toEqual(['blob:before']);
                expect(dropEditor.addUndoSnapshot).not.toHaveBeenCalled();
            });
        });
    });
});

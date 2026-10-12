import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import type { Editor, JSONContent } from '@tiptap/core';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';

import { editorDocToMarkdown, markdownToEditorDoc } from '../../../util/markdown/markdownEditorDoc';
import { LumoIcon } from '../../LumoIcon/LumoIcon';
import type { IconName } from '../../LumoIcon/LumoIcon';
import { createArtifactEditorExtensions } from './artifactEditorExtensions';

// Serializing walks the whole document, so it runs once typing pauses rather than on every
// keystroke. Save reads the editor directly (`getMarkdown`), so it never misses the last edit.
const CHANGE_DEBOUNCE_MS = 150;

export interface ArtifactRichTextEditorHandle {
    getMarkdown: () => string;
}

const withDefaultProtocol = (url: string): string => {
    if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('#') || url.startsWith('/')) {
        return url;
    }
    return `https://${url}`;
};

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

interface ToolbarButtonProps {
    icon: IconName;
    label: string;
    isActive?: boolean;
    disabled?: boolean;
    onClick: () => void;
}

const ToolbarButton = ({ icon, label, isActive = false, disabled = false, onClick }: ToolbarButtonProps) => {
    return (
        <Button
            icon
            shape="ghost"
            color="weak"
            size="small"
            className={clsx('artifact-btn artifact-editor-toolbar-btn shrink-0', isActive && 'is-active')}
            aria-pressed={isActive}
            title={label}
            aria-label={label}
            disabled={disabled}
            // Keep the editor's selection: a toolbar click must not move focus out of the document.
            onMouseDown={(event) => {
                event.preventDefault();
            }}
            onClick={onClick}
        >
            <LumoIcon name={icon} size={16} />
        </Button>
    );
};

const ToolbarSeparator = () => {
    return (
        <span
            className="shrink-0 border-left border-weak h-custom mx-1"
            style={{ '--h-custom': '1rem' }}
            aria-hidden="true"
        />
    );
};

interface LinkFormProps {
    editor: Editor;
    onClose: () => void;
}

const LinkForm = ({ editor, onClose }: LinkFormProps) => {
    const [url, setUrl] = useState<string>(() => {
        return editor.getAttributes('link').href ?? '';
    });
    const hasLink = editor.isActive('link');

    const applyLink = () => {
        const href = url.trim();
        if (!href) {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            onClose();
            return;
        }
        const normalizedHref = withDefaultProtocol(href);
        if (editor.state.selection.empty && !hasLink) {
            editor
                .chain()
                .focus()
                .insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href: normalizedHref } }] })
                .run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: normalizedHref }).run();
        }
        onClose();
    };

    return (
        <form
            className="flex flex-row flex-nowrap items-center gap-2 px-3 py-2 border-bottom border-weak"
            onSubmit={(event) => {
                event.preventDefault();
                applyLink();
            }}
        >
            <Input
                autoFocus
                value={url}
                onValue={setUrl}
                placeholder={c('collider_2025:Placeholder').t`Paste or type a link`}
                aria-label={c('collider_2025:Label').t`Link address`}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        onClose();
                        editor.commands.focus();
                    }
                }}
            />
            <Button size="small" shape="solid" color="norm" type="submit">
                {c('collider_2025:Action').t`Apply`}
            </Button>
            {hasLink && (
                <Button
                    size="small"
                    shape="ghost"
                    color="weak"
                    onClick={() => {
                        editor.chain().focus().extendMarkRange('link').unsetLink().run();
                        onClose();
                    }}
                >
                    {c('collider_2025:Action').t`Remove`}
                </Button>
            )}
        </form>
    );
};

interface EditorToolbarProps {
    editor: Editor;
}

const EditorToolbar = ({ editor }: EditorToolbarProps) => {
    const [isLinkFormOpen, setIsLinkFormOpen] = useState(false);
    const state = useEditorState({
        editor,
        selector: ({ editor: current }) => {
            return {
                heading1: current.isActive('heading', { level: 1 }),
                heading2: current.isActive('heading', { level: 2 }),
                heading3: current.isActive('heading', { level: 3 }),
                bold: current.isActive('bold'),
                italic: current.isActive('italic'),
                strike: current.isActive('strike'),
                code: current.isActive('code'),
                link: current.isActive('link'),
                bulletList: current.isActive('bulletList'),
                orderedList: current.isActive('orderedList'),
                taskList: current.isActive('taskList'),
                blockquote: current.isActive('blockquote'),
                codeBlock: current.isActive('codeBlock'),
                inTable: current.isActive('table'),
                canUndo: current.can().undo(),
                canRedo: current.can().redo(),
            };
        },
    });

    return (
        <div className="shrink-0 w-full min-w-0">
            <div
                className="flex flex-row flex-nowrap items-center gap-0.5 px-3 py-1 border-bottom border-weak overflow-x-auto"
                role="toolbar"
                aria-label={c('collider_2025:Label').t`Formatting`}
            >
                <ToolbarButton
                    icon="Undo2"
                    label={c('collider_2025:Action').t`Undo`}
                    disabled={!state.canUndo}
                    onClick={() => {
                        editor.chain().focus().undo().run();
                    }}
                />
                <ToolbarButton
                    icon="Redo2"
                    label={c('collider_2025:Action').t`Redo`}
                    disabled={!state.canRedo}
                    onClick={() => {
                        editor.chain().focus().redo().run();
                    }}
                />
                <ToolbarSeparator />
                <ToolbarButton
                    icon="Heading1"
                    label={c('collider_2025:Action').t`Heading 1`}
                    isActive={state.heading1}
                    onClick={() => {
                        editor.chain().focus().toggleHeading({ level: 1 }).run();
                    }}
                />
                <ToolbarButton
                    icon="Heading2"
                    label={c('collider_2025:Action').t`Heading 2`}
                    isActive={state.heading2}
                    onClick={() => {
                        editor.chain().focus().toggleHeading({ level: 2 }).run();
                    }}
                />
                <ToolbarButton
                    icon="Heading3"
                    label={c('collider_2025:Action').t`Heading 3`}
                    isActive={state.heading3}
                    onClick={() => {
                        editor.chain().focus().toggleHeading({ level: 3 }).run();
                    }}
                />
                <ToolbarSeparator />
                <ToolbarButton
                    icon="Bold"
                    label={c('collider_2025:Action').t`Bold`}
                    isActive={state.bold}
                    onClick={() => {
                        editor.chain().focus().toggleBold().run();
                    }}
                />
                <ToolbarButton
                    icon="Italic"
                    label={c('collider_2025:Action').t`Italic`}
                    isActive={state.italic}
                    onClick={() => {
                        editor.chain().focus().toggleItalic().run();
                    }}
                />
                <ToolbarButton
                    icon="Strikethrough"
                    label={c('collider_2025:Action').t`Strikethrough`}
                    isActive={state.strike}
                    onClick={() => {
                        editor.chain().focus().toggleStrike().run();
                    }}
                />
                <ToolbarButton
                    icon="Code"
                    label={c('collider_2025:Action').t`Inline code`}
                    isActive={state.code}
                    onClick={() => {
                        editor.chain().focus().toggleCode().run();
                    }}
                />
                <ToolbarButton
                    icon="Link"
                    label={c('collider_2025:Action').t`Link`}
                    isActive={state.link || isLinkFormOpen}
                    onClick={() => {
                        setIsLinkFormOpen((open) => {
                            return !open;
                        });
                    }}
                />
                <ToolbarSeparator />
                <ToolbarButton
                    icon="List"
                    label={c('collider_2025:Action').t`Bulleted list`}
                    isActive={state.bulletList}
                    onClick={() => {
                        editor.chain().focus().toggleBulletList().run();
                    }}
                />
                <ToolbarButton
                    icon="ListOrdered"
                    label={c('collider_2025:Action').t`Numbered list`}
                    isActive={state.orderedList}
                    onClick={() => {
                        editor.chain().focus().toggleOrderedList().run();
                    }}
                />
                <ToolbarButton
                    icon="ListTodo"
                    label={c('collider_2025:Action').t`Checklist`}
                    isActive={state.taskList}
                    onClick={() => {
                        editor.chain().focus().toggleTaskList().run();
                    }}
                />
                <ToolbarButton
                    icon="TextQuote"
                    label={c('collider_2025:Action').t`Quote`}
                    isActive={state.blockquote}
                    onClick={() => {
                        editor.chain().focus().toggleBlockquote().run();
                    }}
                />
                <ToolbarButton
                    icon="SquareCode"
                    label={c('collider_2025:Action').t`Code block`}
                    isActive={state.codeBlock}
                    onClick={() => {
                        editor.chain().focus().toggleCodeBlock().run();
                    }}
                />
                <ToolbarButton
                    icon="Minus"
                    label={c('collider_2025:Action').t`Divider`}
                    onClick={() => {
                        editor.chain().focus().setHorizontalRule().run();
                    }}
                />
                <ToolbarSeparator />
                {state.inTable ? (
                    <>
                        <ToolbarButton
                            icon="BetweenHorizontalEnd"
                            label={c('collider_2025:Action').t`Add row below`}
                            onClick={() => {
                                editor.chain().focus().addRowAfter().run();
                            }}
                        />
                        <ToolbarButton
                            icon="BetweenVerticalEnd"
                            label={c('collider_2025:Action').t`Add column right`}
                            onClick={() => {
                                editor.chain().focus().addColumnAfter().run();
                            }}
                        />
                        <ToolbarButton
                            icon="Rows3"
                            label={c('collider_2025:Action').t`Delete row`}
                            onClick={() => {
                                editor.chain().focus().deleteRow().run();
                            }}
                        />
                        <ToolbarButton
                            icon="Columns3"
                            label={c('collider_2025:Action').t`Delete column`}
                            onClick={() => {
                                editor.chain().focus().deleteColumn().run();
                            }}
                        />
                        <ToolbarButton
                            icon="Trash"
                            label={c('collider_2025:Action').t`Delete table`}
                            onClick={() => {
                                editor.chain().focus().deleteTable().run();
                            }}
                        />
                    </>
                ) : (
                    <ToolbarButton
                        icon="Table"
                        label={c('collider_2025:Action').t`Insert table`}
                        onClick={() => {
                            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                        }}
                    />
                )}
            </div>
            {isLinkFormOpen && (
                <LinkForm
                    editor={editor}
                    onClose={() => {
                        setIsLinkFormOpen(false);
                    }}
                />
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

interface EditorBodyProps {
    initialDoc: JSONContent;
    onChange: (markdown: string) => void;
    onUnavailable: () => void;
}

const EditorBody = forwardRef<ArtifactRichTextEditorHandle, EditorBodyProps>(function EditorBody(
    { initialDoc, onChange, onUnavailable },
    ref
) {
    const extensions = useMemo(() => {
        return createArtifactEditorExtensions();
    }, []);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const changeTimerRef = useRef<ReturnType<typeof setTimeout>>();

    const editor = useEditor({
        extensions,
        content: initialDoc,
        immediatelyRender: true,
        shouldRerenderOnTransaction: false,
        autofocus: 'start',
        // Content the schema rejects means the converter and the schema disagree. Fall back to the
        // markdown source editor instead of letting tiptap silently strip the offending nodes.
        enableContentCheck: true,
        onContentError: () => {
            onUnavailable();
        },
        editorProps: {
            attributes: {
                class: 'artifact-markdown prose artifact-rich-editor',
                'aria-label': c('collider_2025:Label').t`Document editor`,
                spellcheck: 'true',
            },
        },
        onUpdate: ({ editor: current }) => {
            clearTimeout(changeTimerRef.current);
            changeTimerRef.current = setTimeout(() => {
                onChangeRef.current(editorDocToMarkdown(current.getJSON()));
            }, CHANGE_DEBOUNCE_MS);
        },
    });

    useEffect(() => {
        return () => {
            clearTimeout(changeTimerRef.current);
        };
    }, []);

    useImperativeHandle(ref, () => {
        return {
            getMarkdown: () => {
                return editorDocToMarkdown(editor.getJSON());
            },
        };
    }, [editor]);

    return (
        <div className="flex flex-column flex-1 min-h-0 min-w-0 w-full">
            <EditorToolbar editor={editor} />
            <div className="artifact-document-content overflow-auto flex-1 min-h-0 min-w-0 w-full h-full p-4">
                <EditorContent editor={editor} className="h-full" />
            </div>
        </div>
    );
});

interface ArtifactRichTextEditorProps {
    /** Read once on mount; remount (via `key`) to load different content. */
    initialMarkdown: string;
    /** Called with the serialized markdown shortly after the user edits the document. */
    onChange: (markdown: string) => void;
    /** The markdown couldn't be loaded into the editor; the caller should offer the source editor. */
    onUnavailable: () => void;
}

/**
 * WYSIWYG editor for document artifacts. Lazy-loaded by ArtifactPanel only when the user starts a
 * manual edit, so tiptap/ProseMirror never weigh on the read-only panel or the chat.
 */
const ArtifactRichTextEditor = forwardRef<ArtifactRichTextEditorHandle, ArtifactRichTextEditorProps>(
    function ArtifactRichTextEditor({ initialMarkdown, onChange, onUnavailable }, ref) {
        const [initialDoc, setInitialDoc] = useState<JSONContent | null>(null);
        const [seedMarkdown] = useState(initialMarkdown);
        const onUnavailableRef = useRef(onUnavailable);
        onUnavailableRef.current = onUnavailable;

        useEffect(() => {
            let cancelled = false;
            markdownToEditorDoc(seedMarkdown)
                .then((doc) => {
                    if (!cancelled) {
                        setInitialDoc(doc);
                    }
                })
                .catch(() => {
                    if (!cancelled) {
                        onUnavailableRef.current();
                    }
                });
            return () => {
                cancelled = true;
            };
        }, [seedMarkdown]);

        if (!initialDoc) {
            return (
                <div className="artifact-document-content flex-1 min-h-0 p-4" aria-busy="true">
                    <span
                        className="rectangle-skeleton keep-motion rounded inline-block"
                        style={{ width: '12rem', height: '1rem' }}
                    />
                </div>
            );
        }

        return (
            <EditorBody
                ref={ref}
                initialDoc={initialDoc}
                onChange={onChange}
                onUnavailable={() => {
                    onUnavailableRef.current();
                }}
            />
        );
    }
);

export default ArtifactRichTextEditor;

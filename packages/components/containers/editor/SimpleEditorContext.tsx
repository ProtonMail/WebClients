import type { ComponentType, ReactNode } from 'react';
import { createContext, useContext } from 'react';

import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';

export interface SimpleEditorActions {
    focus: () => void;
    setContent: (content: string) => void;
    getContent: () => string;
}

export interface SimpleEditorProps {
    onReady: (actions: SimpleEditorActions) => void;
    onChange: (value: string) => void;
    /** Images can be pasted or dropped in the editor. Defaults to true. */
    supportFiles?: boolean;
    /** Used for the editor default font. Pass it on the first render. */
    mailSettings?: MailSettings;
    isSmallViewportForToolbar?: boolean;
    title?: string;
}

/**
 * The rich text editor lives in @proton/mail-composer, which depends on this package,
 * so the applications provide it to the settings that render it.
 */
const SimpleEditorContext = createContext<ComponentType<SimpleEditorProps> | undefined>(undefined);

interface Props {
    editor: ComponentType<SimpleEditorProps>;
    children: ReactNode;
}

export const SimpleEditorProvider = ({ editor, children }: Props) => (
    <SimpleEditorContext.Provider value={editor}>{children}</SimpleEditorContext.Provider>
);

export const useSimpleEditor = () => {
    const editor = useContext(SimpleEditorContext);

    if (!editor) {
        throw new Error('useSimpleEditor must be used inside a SimpleEditorProvider');
    }

    return editor;
};

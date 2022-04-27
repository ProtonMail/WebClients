import { MailSettings } from '@proton/shared/lib/interfaces';
import { useCallback, useMemo } from 'react';

import { ModalStateProps } from '../../modalTwo';
import { ModalLinkProps } from '../hooks/interface';

import InsertLinkModalComponent from './InsertLinkModalComponent';

interface Props extends ModalLinkProps {
    modalStateProps: ModalStateProps;
    mailSettings?: MailSettings;
}

const InsertLinkModal = ({ editor, createLink, modalStateProps, mailSettings }: Props) => {
    const values = useMemo<{ linkLabel: string | undefined; linkUrl: string | undefined }>(() => {
        if (!editor.hasFocus()) {
            editor.focus();
        }

        const selectionRange = editor.getSelectionRange();

        if (selectionRange === null) {
            return { linkLabel: undefined, linkUrl: undefined };
        }

        const selectedText = editor.getSelectionRange().toString();
        const cursorEl = editor.getElementAtCursor('a[href]') as HTMLElement | null;

        return {
            linkLabel: selectedText || cursorEl?.innerText || undefined,
            linkUrl: selectedText ? undefined : cursorEl?.getAttribute('href') || undefined,
        };
    }, []);

    const handleSubmit = useCallback((nextTitle, nextUrl) => {
        createLink(editor, nextUrl, undefined, nextTitle);
    }, []);

    return (
        <InsertLinkModalComponent
            linkLabel={values.linkLabel}
            linkUrl={values.linkUrl}
            onSubmit={handleSubmit}
            modalStateProps={modalStateProps}
            mailSettings={mailSettings}
        />
    );
};

export default InsertLinkModal;

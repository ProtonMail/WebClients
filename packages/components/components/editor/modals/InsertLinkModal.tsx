import { MailSettings } from '@proton/shared/lib/interfaces';
import { useMemo } from 'react';

import { ModalStateProps } from '../../modalTwo';
import { ModalLinkProps } from '../hooks/interface';

import InsertLinkModalComponent, { InsertLinkModalProps } from './InsertLinkModalComponent';

interface Props extends ModalLinkProps {
    modalStateProps: ModalStateProps;
    mailSettings?: MailSettings;
}

const InsertLinkModal = ({ editor, createLink, modalStateProps, mailSettings }: Props) => {
    const values = useMemo<
        Pick<InsertLinkModalProps, 'cursorLinkElement' | 'selectionRangeFragment'> | undefined
    >(() => {
        if (editor.isDisposed()) {
            return;
        }

        if (!editor.hasFocus()) {
            editor.focus();
        }

        const selectionRangeFragment = editor.getSelectionRange().cloneContents();
        const cursorLinkElement = (editor.getElementAtCursor('a[href]') as HTMLLinkElement) || undefined;

        return {
            selectionRangeFragment,
            cursorLinkElement,
        };
    }, []);

    const handleSubmit = (url: string, altAttribute: string | undefined, textToDisplay?: string | undefined) => {
        createLink(editor, url, altAttribute, textToDisplay);
    };

    return values ? (
        <InsertLinkModalComponent
            selectionRangeFragment={values.selectionRangeFragment}
            cursorLinkElement={values.cursorLinkElement}
            onSubmit={handleSubmit}
            modalStateProps={modalStateProps}
            mailSettings={mailSettings}
        />
    ) : null;
};

export default InsertLinkModal;

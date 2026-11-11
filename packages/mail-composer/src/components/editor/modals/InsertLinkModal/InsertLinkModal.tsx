import { useMemo } from 'react';

import { SelectionRangeTypes } from 'roosterjs-editor-types';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';

import type { ModalLinkProps } from '../../hooks/interface';
import InsertLinkModalComponent from './InsertLinkModalComponent';

interface Props extends ModalLinkProps {
    modalStateProps: ModalStateProps;
}

export type InsertLinkSelectionType = 'text-with-img' | 'img' | 'text' | 'empty';

const InsertLinkModal = ({ editor, createLink, modalStateProps }: Props) => {
    const values = useMemo(() => {
        if (editor.isDisposed()) {
            return;
        }

        if (!editor.hasFocus()) {
            editor.focus();
        }

        const selectionRangeFragment = editor.getSelectionRange()?.cloneContents();
        const selectionRangeEx = editor.getSelectionRangeEx();
        const cursorLinkElement = (editor.getElementAtCursor('a[href]') as HTMLLinkElement) || undefined;

        return {
            selectionRangeEx,
            selectionRangeFragment,
            cursorLinkElement,
        };
    }, []);

    const { selectionType, href, title } = useMemo(() => {
        const hasTextContent = values?.selectionRangeFragment?.textContent;
        const hasImage = values?.selectionRangeFragment?.querySelector('img');
        const href = values?.cursorLinkElement?.getAttribute('href') || undefined;
        const title = values?.cursorLinkElement?.getAttribute('title') || undefined;

        const selectionType: InsertLinkSelectionType = (() => {
            if (hasTextContent && hasImage) {
                return 'text-with-img';
            }
            if ((!hasTextContent && hasImage) || values?.selectionRangeEx.type === SelectionRangeTypes.ImageSelection) {
                return 'img';
            }
            if (hasTextContent && !hasImage) {
                return 'text';
            }

            return 'empty';
        })();

        return {
            selectionType,
            href,
            title,
        };
    }, [values]);

    const handleSubmit = (url: string, altAttribute: string | undefined, textToDisplay?: string | undefined) => {
        createLink(editor, url, altAttribute, textToDisplay);
    };

    return (
        <InsertLinkModalComponent
            modalStateProps={modalStateProps}
            onSubmit={handleSubmit}
            selectionType={selectionType}
            title={values?.selectionRangeFragment?.textContent || values?.cursorLinkElement?.textContent || title || ''}
            url={href}
        />
    );
};

export default InsertLinkModal;

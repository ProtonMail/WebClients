import { useEffect, useLayoutEffect, useRef } from 'react';

import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';

import { useOptionalDraftBodyWriters } from '../../containers/DraftBodyWriterProvider';
import { hasSignatureContainer } from '../../helpers/composer/contentFromComposerMessage';
import type { ComposerID } from '../../store/composers/composerTypes';

interface Props {
    composerID: ComposerID;
    editorReady: boolean;
    isPlainText: boolean;
    addressSignature: string;
    action: MESSAGE_ACTIONS | undefined;
    getEditorContent: () => string;
    write: (body: string) => void;
}

/** The signature is the cut point — no signature means no way to locate the quote boundary, so the whole quote would be dropped. */
export const canPreserveQuote = (
    isPlainText: boolean,
    addressSignature: string,
    action: MESSAGE_ACTIONS | undefined,
    editorContent: string
) => {
    if (action === MESSAGE_ACTIONS.NEW) {
        return true;
    }

    return isPlainText
        ? !!addressSignature.trim() && editorContent.includes(addressSignature)
        : hasSignatureContainer(editorContent);
};

/** Indirects through a ref so the map entry is stable across re-renders while the setter stays fresh. */
export const useDraftBodyWriterRegistration = ({
    composerID,
    editorReady,
    isPlainText,
    addressSignature,
    action,
    getEditorContent,
    write,
}: Props) => {
    const writers = useOptionalDraftBodyWriters();

    const latest = useRef({ isPlainText, addressSignature, action, getEditorContent, write });
    useLayoutEffect(() => {
        latest.current = { isPlainText, addressSignature, action, getEditorContent, write };
    });

    useEffect(() => {
        if (!editorReady || !writers) {
            return;
        }
        writers.set(composerID, {
            preservesQuote: () => {
                const { isPlainText, addressSignature, action, getEditorContent } = latest.current;
                return canPreserveQuote(isPlainText, addressSignature, action, getEditorContent());
            },
            write: (body) => {
                const { isPlainText, addressSignature, action, getEditorContent, write } = latest.current;
                if (!canPreserveQuote(isPlainText, addressSignature, action, getEditorContent())) {
                    return false;
                }
                write(body);
                return true;
            },
        });

        return () => writers.delete(composerID);
    }, [composerID, editorReady, writers]);
};

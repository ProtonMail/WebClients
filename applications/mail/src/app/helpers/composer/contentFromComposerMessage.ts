import { CLASSNAME_SIGNATURE_CONTAINER } from '../message/messageSignature';

type GetContentBeforeBlockquoteOptions = (
    | {
          editorType: 'plaintext';
          /** Plain text type only: Signature as plain text string */
          addressSignature: string;
      }
    | {
          editorType: 'html';
      }
) & { editorContent: string };

/**
 * Returns content before the blockquote and signature in the editor
 */
export const getMessageContentBeforeBlockquote = (args: GetContentBeforeBlockquoteOptions) => {
    const { editorType, editorContent } = args;
    if (!editorContent) {
        return '';
    }

    if ('plaintext' === editorType) {
        const { addressSignature } = args;
        const signatureIndex = editorContent.indexOf(addressSignature);

        return signatureIndex === -1 ? editorContent : editorContent.slice(0, signatureIndex);
    }

    if ('html' === editorType) {
        const editorContentRootDiv = new DOMParser().parseFromString(editorContent, 'text/html').body as HTMLElement;
        let shouldDelete = false;

        // Signature div is in every mail even if it's empty. Because of that and
        // in order to get mail content only, we can remove everything after the signature div
        let current: ChildNode | null = editorContentRootDiv?.childNodes[0];
        while (current) {
            const next: ChildNode | null = current.nextSibling;
            if (
                !shouldDelete &&
                current instanceof HTMLElement &&
                current.classList.contains(CLASSNAME_SIGNATURE_CONTAINER)
            ) {
                shouldDelete = true;
            }

            if (shouldDelete) {
                editorContentRootDiv?.removeChild(current);
            }

            current = next;
        }

        return editorContentRootDiv.innerText;
    }

    return '';
};

type SetContentBeforeBlockquoteOptions = (
    | {
          editorType: 'plaintext';
          /** Plain text type only: User address signature in plain text string */
          addressSignature: string;
      }
    | {
          editorType: 'html';
          /**
           * HTML type only:
           * HTML content will be wrapped in a div
           * containing the default font-family and font-size styles
           *
           * Expected string format example: 'font-family: Arial, serif; font-size: 12px;'
           */
          wrapperDivStyles: string;
      }
) & {
    /** Content to add */
    content: string;
    /** Editor content to parse */
    editorContent: string;
};

export const setMessageContentBeforeBlockquote = (args: SetContentBeforeBlockquoteOptions) => {
    const { editorType, editorContent, content } = args;
    if (!editorContent) {
        return content;
    }

    if ('html' === editorType) {
        const { wrapperDivStyles } = args;
        const editorContentRootDiv = new DOMParser().parseFromString(editorContent, 'text/html').body as HTMLElement;
        let shouldDelete = true;

        // Signature div is in every mail even if it's empty. Because of that and
        // in order to get mail content only, we can remove everything after the signature div
        let current = editorContentRootDiv?.childNodes[0];
        while (current) {
            const next = current.nextSibling;
            if (
                shouldDelete &&
                current instanceof HTMLElement &&
                current.classList.contains(CLASSNAME_SIGNATURE_CONTAINER)
            ) {
                shouldDelete = false;
            }

            if (shouldDelete) {
                editorContentRootDiv?.removeChild(current);
            }

            // @ts-expect-error current can be null
            current = next;
        }

        const divEl = document.createElement('div');
        divEl.setAttribute('style', wrapperDivStyles);
        divEl.innerText = content;
        divEl.appendChild(document.createElement('br'));
        divEl.appendChild(document.createElement('br'));

        if (editorContentRootDiv?.firstChild) {
            editorContentRootDiv?.insertBefore(divEl, editorContentRootDiv?.firstChild);
        } else {
            editorContentRootDiv?.appendChild(divEl);
        }

        return editorContentRootDiv.innerHTML;
    }

    if ('plaintext' === editorType) {
        const { addressSignature } = args;
        const signatureIndex = editorContent.indexOf(addressSignature);
        const postContent = signatureIndex === -1 ? '' : editorContent.slice(signatureIndex);

        return content + postContent;
    }

    throw new Error('Unsupported editor type');
};

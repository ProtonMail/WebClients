import { renderAsync } from 'docx-preview';

export const wordPreview = async (content: Uint8Array<ArrayBuffer>) => {
    const element = document.createElement('div');

    await renderAsync(content, element, element, {
        className: `docx`,
        breakPages: true,
    });

    document.body.appendChild(element);
};

export default wordPreview;

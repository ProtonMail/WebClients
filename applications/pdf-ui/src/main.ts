import { Designer } from '@pdfme/ui';
import Toastify from 'toastify-js';

import { getFont } from '@proton/recovery-kit';
import { getFilledTemplate } from '@proton/recovery-kit/filledTemplate';

import textToClipboard from './textToClipboard';

import './style.css';
import 'toastify-js/src/toastify.css';

async function main() {
    const domContainer = document.getElementById('container');
    if (!domContainer) {
        throw new Error('Container element not found');
    }

    const designer = new Designer({
        domContainer,
        template: getFilledTemplate(),
        options: { font: await getFont() },
    });

    designer.onSaveTemplate((template) => {
        // @ts-ignore
        delete template.basePdf;

        const stringifiedTemplate = JSON.stringify(template, null, 4);

        textToClipboard(stringifiedTemplate);
        Toastify({
            text: 'Template copied to clipboard',
            duration: 3000,
            gravity: 'bottom',
            position: 'center',
            stopOnFocus: true,
            style: {
                marginBottom: '24px',
                padding: '8px 12px',
                borderRadius: '12px',
                background: 'black',
            },
        }).showToast();
    });

    function saveTemplate() {
        designer.saveTemplate();
    }

    // @ts-ignore
    window.saveTemplate = saveTemplate;
}

void main();

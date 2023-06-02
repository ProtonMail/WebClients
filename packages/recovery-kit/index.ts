import { Template, generate } from '@pdfme/generator';

import chunk from '@proton/utils/chunk';

import interBold from './fonts/Inter-Bold.ttf';
import interRegular from './fonts/Inter-Regular.ttf';
import interSemiBold from './fonts/Inter-SemiBold.ttf';
import emptyTemplate from './templates/empty_template.pdf';
import filledTemplate from './templates/filled_template.pdf';

export const getFont = async () => ({
    interRegular: {
        data: await fetch(interRegular).then((res) => res.arrayBuffer()),
        fallback: true,
    },
    interBold: {
        data: await fetch(interBold).then((res) => res.arrayBuffer()),
    },
    interSemiBold: {
        data: await fetch(interSemiBold).then((res) => res.arrayBuffer()),
    },
});

// Copy exported template here
const exportedTemplate = {
    schemas: [
        {
            'email title': {
                type: 'text',
                position: {
                    x: 60,
                    y: 23,
                },
                width: 127.33,
                height: 6.73,
                alignment: 'right',
                fontSize: 16,
                characterSpacing: 0,
                lineHeight: 1,
                fontName: 'interBold',
                fontColor: '#6d4aff',
            },
            date: {
                type: 'text',
                position: {
                    x: 60,
                    y: 31,
                },
                width: 127.33,
                height: 5.68,
                alignment: 'right',
                fontSize: 12.5,
                characterSpacing: 0,
                lineHeight: 1,
                fontColor: '#706d6b',
            },
            'recovery phrase line 1': {
                type: 'text',
                position: {
                    x: 35,
                    y: 102,
                },
                width: 139,
                height: 6,
                lineHeight: 1,
                characterSpacing: 0.5,
                fontName: 'interBold',
                fontSize: 12,
            },
            'recovery phrase line 2': {
                type: 'text',
                position: {
                    x: 35,
                    y: 108.8,
                },
                width: 139,
                height: 6,
                lineHeight: 1,
                characterSpacing: 0.5,
                fontName: 'interBold',
                fontSize: 12,
            },
            password: {
                type: 'text',
                position: {
                    x: 35,
                    y: 77,
                },
                width: 139,
                height: 6,
                lineHeight: 1,
                characterSpacing: 0.5,
                fontName: 'interBold',
                fontSize: 12,
            },
        },
    ],
    columns: ['email title', 'date', 'recovery phrase line 1', 'recovery phrase line 2', 'password'],
    sampledata: [
        {
            'email title': 'eric.norbert@gmail.com',
            date: 'Created on May 30, 2023',
            'recovery phrase line 1': 'auto pottery age relief turkey face',
            'recovery phrase line 2': 'tide useful near lottery alley wolf',
            password: 'password',
        },
    ],
};

export function getTemplate(type: 'empty' | 'filled'): Template {
    const basePdf = (() => {
        if (type === 'empty') {
            return emptyTemplate;
        }

        // type === 'filled'
        return filledTemplate;
    })();

    return {
        basePdf,
        ...(exportedTemplate as Omit<Template, 'basePdf'>),
    };
}

type InputKeys = keyof (typeof exportedTemplate.schemas)[0];
type Input = { [key in InputKeys]: string };

export async function generatePDFKit({
    emailAddress,
    date,
    recoveryPhrase,
    password,
}: {
    emailAddress: string;
    date: string;
    recoveryPhrase: string;
    password: string;
}) {
    const phraseArray = recoveryPhrase.split(' ').map((s) => s.trim());
    const [phraseLine1, phraseLine2] = chunk(phraseArray, 6);

    const inputs: Input[] = [
        {
            'recovery phrase line 1': phraseLine1.join(' '),
            'recovery phrase line 2': phraseLine2.join(' '),
            date,
            'email title': emailAddress,
            password,
        },
    ];

    const pdf = await generate({ template: getTemplate('empty'), inputs, options: { font: await getFont() } });

    return pdf;
}

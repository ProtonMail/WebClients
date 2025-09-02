import type { Template } from '@pdfme/common';
import { generate } from '@pdfme/generator';

import chunk from '@proton/utils/chunk';

import interBold from './fonts/Inter-Bold.ttf';
import interRegular from './fonts/Inter-Regular.ttf';
import interSemiBold from './fonts/Inter-SemiBold.ttf';
import emptyTemplate from './templates/empty_template.pdf';

const getFonts = async () => {
    const [interRegularData, interBoldData, interSemiBoldData] = await Promise.all(
        [interRegular, interBold, interSemiBold].map((asset) => {
            return fetch(asset).then((res) => res.arrayBuffer());
        })
    );
    return [interRegularData, interBoldData, interSemiBoldData] as const;
};

const getPreload = (asset: string, as?: 'font') => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'prefetch');
    link.setAttribute('href', asset);
    if (as) {
        link.setAttribute('as', 'font');
    }
    return link;
};

export const getPrefetch = () => {
    return [
        getPreload(emptyTemplate),
        ...[interRegular, interBold, interSemiBold].map((asset) => {
            return getPreload(asset, 'font');
        }),
    ];
};

export const getFont = async () => {
    const [interRegularData, interBoldData, interSemiBoldData] = await getFonts();

    return {
        interRegular: {
            data: interRegularData,
            fallback: true,
        },
        interBold: {
            data: interBoldData,
        },
        interSemiBold: {
            data: interSemiBoldData,
        },
    };
};

// Copy exported template here
const exportedTemplate = {
    schemas: [
        [
            {
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
                name: 'email title',
            },
            {
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
                fontName: 'interRegular',
                name: 'date',
            },
            {
                type: 'text',
                position: {
                    x: 35,
                    y: 75,
                },
                width: 139,
                height: 6,
                lineHeight: 1,
                characterSpacing: 0.5,
                fontName: 'interBold',
                fontSize: 12,
                name: 'recovery phrase line 1',
            },
            {
                type: 'text',
                position: {
                    x: 35,
                    y: 81,
                },
                width: 139,
                height: 6,
                lineHeight: 1,
                characterSpacing: 0.5,
                fontName: 'interBold',
                fontSize: 12,
                name: 'recovery phrase line 2',
            },
        ],
    ],
    columns: ['email title', 'date', 'recovery phrase line 1', 'recovery phrase line 2'],
    sampledata: [
        {
            'email title': 'eric.norbert@gmail.com',
            date: 'Created on May 30, 2023',
            'recovery phrase line 1': 'auto pottery age relief turkey face',
            'recovery phrase line 2': 'tide useful near lottery alley wolf',
        },
    ],
};

export function getTemplate(basePdf: any): Template {
    return {
        basePdf,
        ...exportedTemplate,
    };
}

type InputKeys = (typeof exportedTemplate.schemas)[0][number]['name'];
type Input = { [key in InputKeys]: string };

export async function generatePDFKit({
    emailAddress,
    date,
    recoveryPhrase,
}: {
    emailAddress: string;
    date: string;
    recoveryPhrase: string;
}) {
    const phraseArray = recoveryPhrase.split(' ').map((s) => s.trim());
    const [phraseLine1 = [], phraseLine2 = []] = chunk(phraseArray, 6);

    const inputs: Input[] = [
        {
            'recovery phrase line 1': phraseLine1.join(' '),
            'recovery phrase line 2': phraseLine2.join(' '),
            date,
            'email title': emailAddress,
        },
    ];

    /**
     * There is an issue where links are stripped from the pdf
     * https://github.com/pdfme/pdfme/issues/239
     */
    const pdf = (await generate({
        template: getTemplate(emptyTemplate),
        inputs,
        options: { font: await getFont() },
    })) as Uint8Array<ArrayBuffer>; // TODO: Improve this type

    return pdf;
}

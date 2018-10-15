import unicodeTagView, { MAP_TAGS } from '../../../../src/app/utils/filters/unicodeTagView';
import { EMAIL_FORMATING } from '../../../../src/app/constants';

const {
    OPEN_TAG_AUTOCOMPLETE,
    CLOSE_TAG_AUTOCOMPLETE,
    OPEN_TAG_AUTOCOMPLETE_RAW,
    CLOSE_TAG_AUTOCOMPLETE_RAW
} = EMAIL_FORMATING;


const convert = (input = '', type = OPEN_TAG_AUTOCOMPLETE_RAW) => input.replace(/###/g,  type);
const count = (input = '', code = OPEN_TAG_AUTOCOMPLETE) => {
    return input
        .split('')
        .filter((n) => n === code)
        .length;
};

describe('[utils/filters] ~ unicodeTagView', () => {

    const filter = unicodeTagView();

    describe('Mode default', () => {

        [
            {
                title: 'nothing for an empty input',
                output: ''
            },
            {
                title: 'encode the OPEN_TAG_AUTOCOMPLETE_RAW',
                input: convert('###html'),
                totalOpen: 1,
                output: convert('###html', OPEN_TAG_AUTOCOMPLETE)
            },
            {
                title: 'encode many tags raw',
                input: `${convert('###html ###html ###html ###html ###html')} monique de test  ${convert('dew### dew### dew### dew### dew###', CLOSE_TAG_AUTOCOMPLETE_RAW)}`,
                totalOpen: 5,
                totalClose: 5,
                output: `${convert('###html ###html ###html ###html ###html', OPEN_TAG_AUTOCOMPLETE)} monique de test  ${convert('dew### dew### dew### dew### dew###', CLOSE_TAG_AUTOCOMPLETE)}`
            }
        ].forEach(({ title, input, output, totalOpen = 0, totalClose = 0 }) => {

            it(`should ${title}`, () => {
                expect(filter(input)).toBe(output);
                expect(count(output)).toBe(totalOpen);
                expect(count(output, CLOSE_TAG_AUTOCOMPLETE)).toBe(totalClose)
            })
        });
    });

    describe('Mode reverse', () => {

        [
            {
                title: 'nothing for an empty input',
                output: ''
            },
            {
                title: 'remove the OPEN_TAG_AUTOCOMPLETE',
                input: convert('###html', OPEN_TAG_AUTOCOMPLETE),
                totalOpen: 1,
                output: convert('###html', OPEN_TAG_AUTOCOMPLETE_RAW)
            },
            {
                title: 'encode many tags encoded',
                input: `${convert('###html ###html ###html ###html ###html', OPEN_TAG_AUTOCOMPLETE)} monique de test  ${convert('dew### dew### dew### dew### dew###', CLOSE_TAG_AUTOCOMPLETE)}`,
                totalOpen: 5,
                totalClose: 5,
                output: `${convert('###html ###html ###html ###html ###html', OPEN_TAG_AUTOCOMPLETE_RAW)} monique de test  ${convert('dew### dew### dew### dew### dew###', CLOSE_TAG_AUTOCOMPLETE_RAW)}`
            }
        ].forEach(({ title, input, output, totalOpen = 0, totalClose = 0 }) => {

            it(`should ${title}`, () => {
                expect(filter(input, 'reverse')).toBe(output);
                expect(count(output, OPEN_TAG_AUTOCOMPLETE_RAW)).toBe(totalOpen);
                expect(count(output, CLOSE_TAG_AUTOCOMPLETE_RAW)).toBe(totalClose)
            })
        });
    });
});

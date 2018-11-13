import {
    filterContactGroup,
    formatLabel,
    defaultDomainsList,
    formatNewEmail
} from '../../../../src/app/ui/factories/autocompleteEmailsModel';
import { EMAIL_FORMATING, AUTOCOMPLETE_DOMAINS } from '../../../../src/app/constants';

const { OPEN_TAG_AUTOCOMPLETE, CLOSE_TAG_AUTOCOMPLETE } = EMAIL_FORMATING;
const CONTACT_GROUPS_LIST = [
    {
      isContactGroup: true,
      name: 'dew'
    },
    {
      isContactGroup: false,
      name: 'polo'
    },
    {
      name: 'jeanne'
    }
];

const getDomainMock = () => {
    const proton = AUTOCOMPLETE_DOMAINS.filter((key) => key.includes('protonmail'));

    const toValue = (email, domain) => `${email}@${domain}`;
    const toList = (value, domains = []) => {
        return domains.map((domain) => ({
          Name: toValue('monique', domain),
          label: toValue('monique', domain),
          value: toValue('monique', domain)
        }))
    }

    return [
        {
              title: 'filter only protonmail domains',
              input: 'monique@proton',
              output: toList('monique', proton)
            },
            {
              title: 'filter only gmail.com domains',
              input: 'monique@g',
              output: toList('monique', ['gmail.com'])
            },
            {
              title: 'filter nothing',
              input: 'monique@',
              output: toList('monique', AUTOCOMPLETE_DOMAINS)
            },
            {
              title: 'filter nothing 2',
              input: 'monique',
              output: toList('monique', AUTOCOMPLETE_DOMAINS)
            }
    ];
};

describe('[ui/factories] ~ autocompleteEmailsModel', () => {
    let service;

    describe('Filter contact groups', () => {

        [
            {
              isFree: true,
              mode: 'contact',
              output: 'hasNotGroup'
            },
            {
              isFree: false,
              mode: 'contact',
              output: 'hasNotGroup'
            },
            {
              isFree: true,
              mode: 'mail',
              output: 'hasNotGroup'
            },
            {
              isFree: false,
              mode: 'mail',
              output: 'hasGroup',
              title: 'contains the contact group'
            }
          ].forEach(({ mode, isFree, title, output }) => {

            const defaultTitle = `not contains the contact group [${mode}] isFree:${isFree}`;
            const filter = filterContactGroup(mode, isFree);
            const list = CONTACT_GROUPS_LIST.filter(filter);

            const hasNotGroup = () => {
                expect(list.length).toBe(2);
                expect(list.some(({ name }) => name === 'dew')).toBe(false);
            };

            const hasGroup = () => {
                expect(list.length).toBe(CONTACT_GROUPS_LIST.length);
            };

            const actions = { hasGroup, hasNotGroup };

            it(`should ${title || defaultTitle}`, actions[output]);

          });
    });

    describe('Format labels', () => {

        [
            {
              title: 'empty string if no email/name provided',
              output: ''
            },
            {
              email: ' monique ',
              title: 'email trimed if no email provided',
              output: 'monique'
            },
            {
              name: 'dew',
              title: 'do not add the totalMember if value is falsy and we have a name',
              output: 'dew'
            },
            {
              name: 'dew',
              totalMember: 0,
              title: 'do not add the totalMember if value is falsy 2 and we have a name + no email',
              output: 'dew'
            },
            {
              name: 'dew',
              totalMember: 1,
              title: 'add the totalMember if value is truthy and we have a name + no email',
              output: 'dew 1'
            },
            {
              name: 'dew',
              email: 'monique',
              totalMember: 1,
              title: 'format email style',
              output: `dew ${OPEN_TAG_AUTOCOMPLETE}monique${CLOSE_TAG_AUTOCOMPLETE}`
            },
          ].forEach(({ name, email, totalMember, title, output }) => {

            const value = formatLabel(name, email, totalMember);

            it(`should ${title}`, () => {
                expect(value).toBe(output);
            });

          });
    });

    describe('Format domains autocompletion', () => {

        getDomainMock()
            .forEach(({ input, title, output }) => {

            const value = defaultDomainsList(input);

            it(`should ${title}`, () => {
                expect(value).toEqual(output);
            });

          });
    });

    describe('Format new emails', () => {

        [
            {
              title: 'return empty values if no config provided',
              output: {
                Name: '',
                Address: ''
              }
            },
            {
              title: 'return values if label does not contain an email',
              input: ['monique'],
              output: {
                Name: 'monique',
                Address: ''
              }
            },
            {
              title: 'return values if label does not contain an email 2',
              input: ['monique', 'jeanne'],
              output: {
                Name: 'monique',
                Address: 'jeanne'
              }
            },
            {
              title: 'change the default return key',
              input: ['monique', 'jeanne', 'baker'],
              output: {
                Name: 'monique',
                baker: 'jeanne'
              }
            },
            {
              title: 'set address as value if no full format provided',
              input: ['monique@pm.me', 'jeanne'],
              output: {
                Name: 'monique@pm.me',
                Address: 'jeanne'
              }
            },
            {
              title: 'extract Name + email from default format',
              input: ['Robert <monique@pm.me>', 'jeanne'],
              output: {
                Name: 'Robert',
                Address: 'monique@pm.me'
              }
            },
            {
              title: 'extract Name + email from custom outlook format',
              input: ['Robert (monique@pm.me)', 'jeanne'],
              output: {
                Name: 'Robert',
                Address: 'monique@pm.me'
              }
            },,
            {
              title: 'extract Name + email from default format + missing end',
              input: ['Robert <monique@pm.me', 'jeanne'],
              output: {
                Name: 'Robert',
                Address: 'monique@pm.me'
              }
            },
            {
              title: 'extract Name + email from custom outlook format + missing end',
              input: ['Robert (monique@pm.me', 'jeanne'],
              output: {
                Name: 'Robert',
                Address: 'monique@pm.me'
              }
            },
            {
              title: 'not extract Name + email if custom key value is defined',
              input: ['Robert (monique@pm.me)', 'jeanne', 'baker'],
              output: {
                Name: 'Robert (monique@pm.me)',
                baker: 'jeanne'
              }
            }
        ].forEach(({ input, title, output }) => {

            const value = formatNewEmail.apply(null, input);

            it(`should ${title}`, () => {
                expect(value).toEqual(output);
            });

        });
    });
});

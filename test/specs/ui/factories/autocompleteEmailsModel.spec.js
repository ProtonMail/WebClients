import _ from 'lodash';

import { EMAIL_FORMATING, AUTOCOMPLETE_DOMAINS } from '../../../../src/app/constants';
import autocompleteEmailsModel, {
    filterContactGroup,
    formatLabel,
    defaultDomainsList,
    formatNewEmail
} from '../../../../src/app/ui/factories/autocompleteEmailsModel';
import dispatchersService from '../../../../src/app/commons/services/dispatchers';
import {
    listEmails as defaultListEmails,
    listGroups as defaultListGroups,
    GROUP_NUMBERS as DEFAULT_GROUP_NUMBERS,
    CACHE as defaultCache
} from '../../../mocks/autocomplete/default';
import {
    previousList as configPreviousList,
    previousAutocomplete as configPreviousAutocomplete
} from '../../../mocks/autocomplete/withPreviousList';
import { generateModuleName } from '../../../utils/helpers';


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
    const MODULE = generateModuleName();

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

    function testModel({ previousList = [], config, previousAutocomplete = [], userTypeConfig = {} } = {}, { getter = {} } = {}) {

        getter.contactGroupModel = getter.contactGroupModel || defaultListGroups;
        getter.contactEmails = getter.contactEmails || defaultListEmails;

        let model;
        let dispatchers;
        let contactEmails;
        let contactGroupModel;
        let userType = () => userTypeConfig;

        // EMAILS is the default mode
        const { mode: MODE_AUTOCOMPLETE = "emails" } = (config || {});

        const getTotal = (n = 0) => (previousList.length + n);

        const ADD_ITEM = {
          "group": {
            "label": "jojo",
            "value": {
              "value": "9exMRyGTwd37rnnlLqZNdMZGISitMPGHLnj8joZ4F2qd_VSrAWmXV82eZBWmbAWz-Wsq2et8ApyQAlhAAWLYhQ==",
              "data": {
                "isContactGroup": true
              }
            }
          },
          "email": {
            "label": "AAAAA ‹test+roberto2@protonmail.com›",
            "value": {
              "value": "test+roberto2@protonmail.com",
              "data": {
                "isContactGroup": false
              }
            }
          },
          emailAddedd: {
            Name: 'AAAAA',
            label: "AAAAA ‹test+roberto2@protonmail.com›",
            Address: 'test+roberto2@protonmail.com',
            isContactGroup: false
          },
          groupAddedd: {
            Name: 'jojo',
            label: "jojo",
            Address: '9exMRyGTwd37rnnlLqZNdMZGISitMPGHLnj8joZ4F2qd_VSrAWmXV82eZBWmbAWz-Wsq2et8ApyQAlhAAWLYhQ==',
            isContactGroup: true
          }

        };

        angular.module(MODULE, [])
            .factory('dispatchers', dispatchersService)
            .factory('contactGroupModel', () => ({
                get: _.noop,
                getNumber: (id) => DEFAULT_GROUP_NUMBERS[id]
            }))
            .factory('contactEmails', () => ({
                get: _.noop
            }));

        beforeEach(angular.mock.module(MODULE));

        beforeEach(angular.mock.inject(($injector) => {

            contactGroupModel = $injector.get('contactGroupModel');
            contactEmails = $injector.get('contactEmails');
            dispatchers = $injector.get('dispatchers');
            spyOn(contactGroupModel, 'get').and.returnValue(getter.contactGroupModel);
            spyOn(contactEmails, 'get').and.returnValue(getter.contactEmails);
            spyOn(contactGroupModel, 'getNumber').and.callThrough();
            service = autocompleteEmailsModel($injector, dispatchers, userType);
            model = service(previousList, config);
        }));

        it('should not fetch contacts', () => {
            expect(contactEmails.get).not.toHaveBeenCalled();
        });

        it('should not fetch groups', () => {
            expect(contactGroupModel.get).not.toHaveBeenCalled();
        });

        if (!previousList.length) {
            it('should init an empty list', () => {
                expect(model.all()).toEqual([])
            });

            it('should init an empty list', () => {
                expect(model.isEmpty()).toEqual(true)
            });
        } else {
            it('should init a list', () => {
                const list = previousAutocomplete.map((item) => ({
                    ...item,
                    mode: MODE_AUTOCOMPLETE
                }));
                expect(model.all()).toEqual(list);
            });

            it('should init not an empty list', () => {
                expect(model.isEmpty()).toEqual(false)
            });
        }

        describe('create the cache on filter', () => {

            beforeEach(() => {
                model.filterContact('monique');
            });

            it('should fetch contacts once', () => {
                model.filterContact('monique');
                expect(contactEmails.get).toHaveBeenCalledTimes(1);
            });

            it('should fetch groups once', () => {
                model.filterContact('monique');
                expect(contactGroupModel.get).toHaveBeenCalledTimes(1);
            });

            it(`should fetch groups number: ${defaultListGroups.length}`, () => {
                expect(contactGroupModel.getNumber).toHaveBeenCalledTimes(defaultListGroups.length);
                defaultListGroups.forEach(({ ID }) => {
                    expect(contactGroupModel.getNumber).toHaveBeenCalledWith(ID);
                });
            });
        });

        describe('Add items', () => {

            it('should add an email', () => {
                expect(model.all().length).toBe(getTotal(0));
                expect(model.exist(ADD_ITEM.emailAddedd.Address)).toBe(false);

                model.add(ADD_ITEM.email);

                expect(model.all().length).toBe(getTotal(1));
                expect(model.exist(ADD_ITEM.emailAddedd.Address)).toBe(true);
            });

            it('should clear the model', () => {
                model.add(ADD_ITEM.email);
                model.clear();
                expect(model.isEmpty()).toBe(true);
            });

            it('should add a group', () => {
                expect(model.all().length).toBe(getTotal(0));
                expect(model.exist(ADD_ITEM.groupAddedd.Address)).toBe(false);

                model.add(ADD_ITEM.group);

                expect(model.all().length).toBe(getTotal(1));
                expect(model.exist(ADD_ITEM.groupAddedd.Address)).toBe(true);
            });

            if (MODE_AUTOCOMPLETE !== 'contact') {
                it('should add 2 items without duplicata', () => {

                    expect(model.all().length).toBe(getTotal(0));
                    model.add(ADD_ITEM.email);
                    model.add(ADD_ITEM.group);

                    const email = model.all().some(({ Address }) => {
                        return ADD_ITEM.emailAddedd.Address === Address;
                    });

                    const group = model.all().some(({ Address }) => {
                        return ADD_ITEM.groupAddedd.Address === Address;
                    });

                    expect(model.all().length).toBe(getTotal(2));
                    expect(email).toBe(true);
                    expect(group).toBe(true);

                    model.add(ADD_ITEM.email);
                    model.add(ADD_ITEM.group);
                    expect(model.all().length).toBe(getTotal(2));
                });
            } else {
                it('should add 2 items without duplicata', () => {
                    expect(model.all().length).toBe(getTotal(0));
                    model.add(ADD_ITEM.email);
                    expect(model.all().length).toBe(getTotal(1));
                    model.add(ADD_ITEM.email);
                    expect(model.all().length).toBe(getTotal(1));
                });
            }
        });

        describe('Filter existing data', () => {

            if (MODE_AUTOCOMPLETE !== 'contact') {
                it('should contains the group in the autocomplete', () => {
                    const { list, hasAutocompletion } = model.filterContact('jojo');
                    expect(hasAutocompletion).toBe(true);
                    expect(list.length).toBe(1);
                });

                it('should not contains the group in the autocomplete anymore', () => {
                    model.add(ADD_ITEM.group);
                    const { list, hasAutocompletion } = model.filterContact('jojo');
                    expect(hasAutocompletion).toBe(false);
                    expect(list.length).toBe(0);
                });
            } else {
                it('should not contains the group in the autocomplete', () => {
                    const { list, hasAutocompletion } = model.filterContact('jojo');
                    expect(hasAutocompletion).toBe(false);
                    expect(list.length).toBe(0);
                });
            }

            if (MODE_AUTOCOMPLETE !== 'contactGroup') {
                it('should contains the email in the autocomplete', () => {
                    const { list, hasAutocompletion } = model.filterContact('AAAAA');
                    expect(hasAutocompletion).toBe(true);
                    expect(list.length).toBe(1);
                });

                it('should not contains the email in the autocomplete anymore', () => {
                    model.add(ADD_ITEM.email);
                    const { list, hasAutocompletion } = model.filterContact('AAAAA');
                    expect(hasAutocompletion).toBe(false);
                    expect(list.length).toBe(0);
                });
            } else {
                it('should not contains the email in the autocomplete', () => {
                    model.add(ADD_ITEM.email);
                    const { list, hasAutocompletion } = model.filterContact('AAAAA');
                    expect(hasAutocompletion).toBe(false);
                    expect(list.length).toBe(0);
                });
            }
        });

        describe('Listeners', () => {

            let on;
            let dispatcher;
            beforeEach(() => {
                if (MODE_AUTOCOMPLETE !== 'contactGroup') {
                    model.add(ADD_ITEM.email);
                }
                if (MODE_AUTOCOMPLETE !== 'contact') {
                    model.add(ADD_ITEM.group);
                }

                config = dispatchers([
                    'contacts',
                    'contactGroupModel',
                    'logout'
                ]);
                on = config.on;
                dispatcher = config.dispatcher;
            });

            function testEvent(scope, event, debounced) {
                return (done) => {
                    model.filterContact();
                    expect(contactEmails.get).toHaveBeenCalledTimes(1);
                    expect(contactGroupModel.get).toHaveBeenCalledTimes(1);

                    model.filterContact();
                    expect(contactEmails.get).toHaveBeenCalledTimes(1);
                    expect(contactGroupModel.get).toHaveBeenCalledTimes(1);

                    on(scope, () => {

                        if (debounced) {
                            expect(_.debounce).toHaveBeenCalledWith(jasmine.any(Function), 300);
                            return done();
                        }

                        setTimeout(() => {
                            model.filterContact();
                            expect(contactEmails.get).toHaveBeenCalledTimes(2);
                            expect(contactGroupModel.get).toHaveBeenCalledTimes(2);
                            done();
                        }, 32);
                    });

                    if (debounced) {
                        spyOn(_, 'debounce').and.returnValue(_.noop);
                    }
                    dispatcher[scope](event);
                }
            }

            function testEventEffect(scope, event) {
                return (done) => {

                    on('ui', (e, { type, data = {}}) => {
                        setTimeout(() => {
                            model.filterContact();
                            expect(type).toBe('autocompleteContacts.updated');
                            expect(data).toEqual({ type: event });
                            done();
                        }, 32);
                    });
                    dispatcher[scope](event);
                };
            }

            function testWrongEvent(scope, event) {
                return (done) => {

                    on(scope, () => {
                        setTimeout(() => {
                            model.filterContact();
                            expect(contactEmails.get).toHaveBeenCalledTimes(1);
                            expect(contactGroupModel.get).toHaveBeenCalledTimes(1);
                            done();
                        }, 32);
                    });
                    dispatcher[scope](event);
                };
            }

            it('should clear the cache on logout', (done) => {

                model.filterContact();
                expect(contactEmails.get).toHaveBeenCalledTimes(1);
                expect(contactGroupModel.get).toHaveBeenCalledTimes(1);

                model.filterContact();
                expect(contactEmails.get).toHaveBeenCalledTimes(1);
                expect(contactGroupModel.get).toHaveBeenCalledTimes(1);

                on('logout', () => {
                    model.filterContact();
                    expect(contactEmails.get).toHaveBeenCalledTimes(2);
                    expect(contactGroupModel.get).toHaveBeenCalledTimes(2);
                    done();
                });
                dispatcher.logout();
            });

            describe('event contactGroupModel', () => {

                it('should refresh the cache for type contactEmails.updated', testEvent('contactGroupModel', 'cache.refresh'));


                it('should refresh the cache for type cache.refresh + emit ui event', testEventEffect('contactGroupModel', 'cache.refresh'));

                it('should not refresh the cache for type !cache.refresh', testWrongEvent('contactGroupModel', 'cache'));
            });

            describe('event contacts', () => {

                it('should refresh the cache for type contactEmails.updated', testEvent('contacts', 'contactEmails.updated'));

                it('should refresh the cache for type contactEmails.updated', testEvent('contacts', 'resetContacts'));

                it('should refresh the cache for type contactEmails.updated + emit ui event', testEventEffect('contacts', 'contactEmails.updated'));

                it('should refresh the cache for type resetContacts + emit ui event', testEventEffect('contacts', 'resetContacts'));

                it('should not refresh the cache for type !cache.refresh', testWrongEvent('contactGroupModel', 'cache'));


                it('should refresh debouced the cache for type contactsUpdated', testEvent('contacts', 'contactsUpdated', true));
            });
        })

        describe('Remove data', () => {
            beforeEach(() => {
                if (MODE_AUTOCOMPLETE !== 'contact') {
                    model.add(ADD_ITEM.group);
                }

                if (MODE_AUTOCOMPLETE !== 'contactGroup') {
                    model.add(ADD_ITEM.email);
                }
            });

            if (['contact', 'emails'].includes(MODE_AUTOCOMPLETE)) {
                it('should remove the email', () => {
                    const size = model.all().length;
                    model.removeItem(ADD_ITEM.emailAddedd.Address);

                    const item = model.all().some(({ Address }) => {
                        return ADD_ITEM.emailAddedd.Address === Address;
                    });

                    expect(model.all().length).toBe(size - 1);
                    expect(item).toBe(false);
                });
            }

            if (['contactGroup', 'emails'].includes(MODE_AUTOCOMPLETE)) {

                it('should remove only the group', () => {
                    const size = model.all().length;

                    model.removeItem(ADD_ITEM.groupAddedd.Address);

                    const item = model.all().some(({ Address }) => {
                        return ADD_ITEM.groupAddedd.Address === Address;
                    });

                    expect(model.all().length).toBe(size - 1);
                    expect(item).toBe(false);
                });
            }

            if (MODE_AUTOCOMPLETE === 'emails') {
                it('should removeBy address', () => {
                    model.removeByAddress(ADD_ITEM.groupAddedd.Address);
                    model.removeByAddress(ADD_ITEM.emailAddedd.ID);

                    const item = model.all().some(({ Address }) => {
                        return ADD_ITEM.groupAddedd.Address === Address;
                    });
                    const email = model.all().some(({ Address }) => {
                        return ADD_ITEM.emailAddedd.Address === Address;
                    });

                    expect(model.all().length).toBe(getTotal(1));
                    expect(item).toBe(false);
                    expect(email).toBe(true);
                });
            }


            it('should remove the last item', () => {
                const size = model.all().length;
                const item = _.last(model.all());
                model.removeLast();

                const match = model.all().some(({ Address }) => {
                    return item.Address === Address;
                });

                expect(model.all().length).toBe(size - 1);
                expect(match).toBe(false);
            });

            it('should check if an item exist', () => {
                const item = _.last(model.all());
                model.removeLast();
                expect(model.exist(item.Address)).toBe(false);
            });
        });

        describe('Update the email', () => {
            const NEW_EMAIL = 'monique@protonmail.com';
            const NEW_NAME = 'monique';

            beforeEach(() => {
                if (MODE_AUTOCOMPLETE !== 'contact') {
                    model.add(ADD_ITEM.group);
                }

                if (MODE_AUTOCOMPLETE !== 'contactGroup') {
                    model.add(ADD_ITEM.email);
                }
            });

            // if (['contact', 'emails'].includes(MODE_AUTOCOMPLETE)) {
            // }

            // if (['contactGroup', 'emails'].includes(MODE_AUTOCOMPLETE)) {

            // }

            if (MODE_AUTOCOMPLETE === 'emails') {
                it('should update the email', () => {
                    const size = model.all().length;

                    const item = model.all().find(({ Address }) => {
                        return ADD_ITEM.emailAddedd.Address === Address;
                    });
                    model.updateEmail(ADD_ITEM.emailAddedd.Address, NEW_EMAIL);

                    const itemNew = model.all().find(({ Address }) => {
                        return NEW_EMAIL === Address;
                    });

                    expect(model.all().length).toBe(size);
                    expect(model.exist(ADD_ITEM.emailAddedd.Address)).toBe(false);
                    expect(model.exist(NEW_EMAIL)).toBe(true);

                    expect(itemNew).toEqual({
                        ...item,
                        Address: NEW_EMAIL,
                        Name: undefined
                    });
                });

                it('should update the email + name', () => {
                    const size = model.all().length;
                    const item = model.all().find(({ Address }) => {
                        return ADD_ITEM.emailAddedd.Address === Address;
                    });

                    model.updateEmail(ADD_ITEM.emailAddedd.Address, NEW_EMAIL, NEW_NAME);

                    const itemNew = model.all().find(({ Address }) => {
                        return NEW_EMAIL === Address;
                    });

                    expect(model.all().length).toBe(size);
                    expect(model.exist(ADD_ITEM.emailAddedd.Address)).toBe(false);
                    expect(model.exist(NEW_EMAIL)).toBe(true);
                    expect(itemNew).toEqual({
                        ...item,
                        Address: NEW_EMAIL,
                        Name: NEW_NAME
                    });
                });
            }
        });
    }

    describe('Autocomplete: Default', () => {
        testModel();
    });

    describe('Autocomplete: previousList', () => {
        testModel({
            previousList: configPreviousList,
            previousAutocomplete: configPreviousAutocomplete
        });
    });

    describe('Autocomplete: previousList, user non free', () => {
        testModel({
            previousList: configPreviousList,
            previousAutocomplete: configPreviousAutocomplete,
            userTypeConfig: {
                isFree: false,
                isPaid: true
            }
        });
    });

    describe('Autocomplete: mode: contactGroup', () => {
        testModel({ config: { mode: 'contactGroup' } });
    });
    // -----> no previousList mode for this mode and not available for free user

    describe('Autocomplete: mode: contact advanced, user non free', () => {
        testModel({
            config: {
                keyValue: 'ID',
                extraKeys: ['Email'],
                mode: 'contact'
            },
            userTypeConfig: {
                isFree: false,
                isPaid: true
            }
        });
    });

    describe('Autocomplete: mode: contact advanced, user free', () => {
        testModel({
            config: {
                keyValue: 'ID',
                extraKeys: ['Email'],
                mode: 'contact'
            },
            userTypeConfig: {
                isFree: true
            }
        });
    });


});

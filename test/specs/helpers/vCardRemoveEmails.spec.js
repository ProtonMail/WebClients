import _ from 'lodash';
import vCard from 'vcf';

import { GROUP_FIELDS } from '../../../src/helpers/vCardFields';
import vCardRemoveEmails from '../../../src/helpers/vCardRemoveEmails';
import uniqEmailSimple from '../../media/vcard/uniqEmailSimple.vcf';
import uniqEmailNote from '../../media/vcard/uniqEmailNote.vcf';
import manyEmailsGroupedFields from '../../media/vcard/manyEmailsGroupedFields.vcf';
import manySameEmailsDiffTypes from '../../media/vcard/manySameEmailsDiffTypes.vcf';

const cardUniqEmailSimple = vCard.parse(uniqEmailSimple)[0];
const cardUniqEmailNote = vCard.parse(uniqEmailNote)[0];
const cardManyEmailsGroupedFields = vCard.parse(manyEmailsGroupedFields)[0];
const cardManySameEmailsDiffTypes = vCard.parse(manySameEmailsDiffTypes)[0];

function extractChanged(oldCard, newCard) {
   return Object.keys(oldCard.data).reduce((acc, field) => {
        const key = !newCard.get(field) ? 'removed' : 'keeped';
        acc[key].push(field);
        return acc;
    }, {
        keeped: [],
        removed: []
    });
}

function diffPropertiesFactory(card, testCard, map) {
    return (field) => {
        const fromOldEmails = card.get('email').reduce((acc, prop) => {
            if (!map[prop.valueOf()]) {
                return acc;
            }
            const { group } = prop.getParams();
            const keys = card.get(field)
                .filter((prop) => prop.getParams().group === group)
                .map((prop) => prop.valueOf());
            acc.push(...keys);
            return acc;
        }, [])
        const fromOldCard = card.get(field).map((prop) => prop.valueOf());
        const fromNewCard = testCard.get(field).map((prop) => prop.valueOf());
        const diff = _.difference(fromOldCard, fromNewCard);

        return { fromOldEmails, diff };
    };
}

function mapLinkedPropGroups(card) {
    const [, fields] = card.toJSON();
    const formatted = fields.map(([ field, param, type, value ]) => ({
        field, param, type, value
    }));
    const map = _.groupBy(formatted, 'param.group');
    delete map[void 0];
    return map;
}

function mapLinkedPropField(card) {
    const [, fields] = card.toJSON();
    const formatted = fields.map(([ field, param, type, value ]) => ({
        field, param, type, value
    }));
    const map = _.groupBy(formatted, 'field');
    delete map[void 0];
    return map;
}

describe('Helper vCardRemoveEmails', () => {

    function scenario({ testCard, contactEmails = [], isUniq }, type) {

        return () => {
            let card;
            let diffProperties;

            beforeEach(() => {
                if (!card) {
                    card = vCardRemoveEmails(testCard, contactEmails, isUniq);
                    diffProperties = diffPropertiesFactory(card, testCard, contactEmails);
                }
            });

            if (type === 'wrongMap') {
                it('should output a cloned card', () => {
                    const { keeped, removed } =  extractChanged(testCard, card);
                    const isGroupedKeeped = keeped.some((key) => GROUP_FIELDS.includes(key));
                    expect(removed.length).toBe(0);
                    expect(isGroupedKeeped).toBe(true);
                });
                return;
            }

            it('should output a new card', () => {
                expect(testCard.toString()).not.toBe(card.toString());
            });

            // Use-case 1 email only
            if (contactEmails.length === 1 || type === 'removeAllContactMany') {
                it('should remove the email', () => {
                    expect(card.get('email')).not.toBeDefined();
                });

                it('should remove only the email + linked properties', () => {
                    const { keeped, removed } =  extractChanged(testCard, card);
                    const isGroupedRemoved = removed.every((key) => GROUP_FIELDS.includes(key));
                    const isGroupedKeeped = keeped.every((key) => !GROUP_FIELDS.includes(key));
                    expect(isGroupedRemoved).toEqual(true);
                    expect(isGroupedKeeped).toEqual(true);
                });

                return
            }

            // Use-case more than 1 email
            it('should not remove the email', () => {
                expect(card.get('email')).toBeDefined();
            });

            if (type === 'sameEmailsDiffTypes') {

                it('should only remove emails with specific type', () => {
                    const oldTypeMap = _.groupBy(contactEmails, 'Type');
                    const newTypes = card.get('email').map((prop) => {
                        const { type } = prop.getParams();
                        return type;
                    });

                    const test = newTypes.every((type) => {
                        return !oldTypeMap[type];
                    });
                    expect(test).toBe(true);
                });
                return;
            }

            it('should remove only X-PM-MIMETYPE', () => {
                const { keeped, removed } =  extractChanged(testCard, card);
                const isGroupedKeeped = keeped.some((key) => GROUP_FIELDS.includes(key));
                expect(removed).toEqual(['x-pm-mimetype']);
                expect(isGroupedKeeped).toBe(true);
            });

            it('should remove keys attached to emails', () => {
                const { diff, fromOldEmails } = diffProperties('key');
                expect(diff).toEqual(fromOldEmails);
            });

            it('should remove categories attached to emails', () => {
                const { diff, fromOldEmails } = diffProperties('categories');
                expect(diff).toEqual(fromOldEmails);
            });

            describe('Rename groups', () => {

                let mapOld;
                let mapNew;

                beforeEach(() => {
                    if (!mapNew) {
                        mapOld = mapLinkedPropGroups(testCard);
                        mapNew = mapLinkedPropGroups(card);

                    }
                });

                if (type === 'wrongTypeMixed') {
                    it('should remove 1 group', () => {
                        expect(Object.keys(mapOld).length).toBe(4);
                        expect(Object.keys(mapNew).length).toBe(3);
                    });

                    it('should remove xxxlol@pm.me', () => {
                        const { email } = mapLinkedPropField(card);
                        const test = email.some(({ value }) => value === 'xxxlol@pm.me');
                        expect(test).toBe(false);
                    });

                    it('should not remove xxxlol@protonmail.com', () => {
                        const { email } = mapLinkedPropField(card);
                        const test = email.some(({ value }) => value === 'xxxlol@protonmail.com');
                        expect(test).toBe(true);
                    });

                    it('should keep the first group as it was', () => {
                        const mapOldField = _.cloneDeep(_.groupBy(mapOld.item1, 'field'));
                        const mapNewField = _.cloneDeep(_.groupBy(mapNew.item1, 'field'));

                        // Cast as Number
                        const formatPref = (list) => {
                            mapOldField[list].forEach((item) => {
                                item.param.pref = +item.param.pref;
                            });
                        };
                        formatPref('email');
                        formatPref('key');

                        expect(mapOldField).toEqual(mapNewField);
                    });

                    it('should keep the last group as it was', () => {
                        const mapOldField = _.cloneDeep(_.groupBy(mapOld.item4, 'field'));
                        const mapNewField = _.cloneDeep(_.groupBy(mapNew.item3, 'field'));

                        // Cast as Number
                        const formatPref = (list) => {
                            mapOldField[list].forEach((item) => {
                                item.param.pref = +item.param.pref;
                            });
                        };
                        formatPref('email');
                        formatPref('key');

                        // Update with the new name of the group
                        const formatNewGroup = (list) => {
                            mapOldField[list].forEach((item) => {
                                item.param.group = 'item3';
                            });
                        }
                        // Update with the new position
                        mapOldField.email[0].param = {
                            ...mapOldField.email[0].param,
                            pref: 3
                        };

                        formatNewGroup('email')
                        formatNewGroup('key')
                        formatNewGroup('categories')

                        expect(mapOldField).toEqual(mapNewField);
                    });

                    it('should move the 3rd item to position 2', () => {
                        const mapOldField = _.cloneDeep(_.groupBy(mapOld.item3, 'field'));
                        const mapNewField = _.cloneDeep(_.groupBy(mapNew.item2, 'field'));

                        // Cast as Number
                        const formatPref = (list) => {
                            mapOldField[list].forEach((item) => {
                                item.param.pref = +item.param.pref;
                            });
                        };
                        formatPref('email');

                        mapOldField.email[0].param = {
                            ...mapOldField.email[0].param,
                            group: 'item2',
                            pref: 2
                        };

                        expect(mapOldField).toEqual(mapNewField);
                    });

                    return;
                }

                it('should remove 2 groups', () => {
                    expect(Object.keys(mapOld).length).toBe(4);
                    expect(Object.keys(mapNew).length).toBe(2);
                });

                it('should keep the first group as it was', () => {
                    const mapOldField = _.cloneDeep(_.groupBy(mapOld.item1, 'field'));
                    const mapNewField = _.cloneDeep(_.groupBy(mapNew.item1, 'field'));

                    // Cast as Number
                    const formatPref = (list) => {
                        mapOldField[list].forEach((item) => {
                            item.param.pref = +item.param.pref;
                        });
                    };
                    formatPref('email');
                    formatPref('key');

                    expect(mapOldField).toEqual(mapNewField);
                });

                it('should move the 3rd item to position 2', () => {
                    const mapOldField = _.cloneDeep(_.groupBy(mapOld.item3, 'field'));
                    const mapNewField = _.cloneDeep(_.groupBy(mapNew.item2, 'field'));

                    // Cast as Number
                    const formatPref = (list) => {
                        mapOldField[list].forEach((item) => {
                            item.param.pref = +item.param.pref;
                        });
                    };
                    formatPref('email');

                    mapOldField.email[0].param = {
                        ...mapOldField.email[0].param,
                        group: 'item2',
                        pref: 2
                    };
                    expect(mapOldField).toEqual(mapNewField);
                });
            });
        }
    }

    describe('Uniq email + nothing else', scenario({
        testCard: cardUniqEmailSimple,
        contactEmails: [
            {
                Email: 'xxxlol@pm.me',
                Type: ['email']
            }
        ],
        isUniq: true
    }));

    describe('Uniq email + note', scenario({
        testCard: cardUniqEmailNote,
        contactEmails: [
            {
                Email: 'xxxlol@protonmail.com',
                Type: ['email']
            }
        ],
        isUniq: true
    }));

    describe('Uniq email + note ~ wrong map', scenario({
        testCard: cardUniqEmailNote,
        contactEmails: [
            {
                Email: 'xxxlol@pm.me',
                Type: ['email']
            }
        ],
        isUniq: true
    }, 'wrongMap'));


    describe('Many emails', scenario({
        testCard: cardManyEmailsGroupedFields,
        contactEmails: [
            {
                Email: 'xxxlol@pm.me',
                Type: ['home']
            },
            {
                Email: 'xxxlol@protonmail.com',
                Type: ['work']
            }
        ]
    }));


    describe('Many email mixed case', scenario({
        testCard: cardManyEmailsGroupedFields,
        contactEmails: [
            {
                Email: 'xxxlol@pm.me',
                Type: ['home']
            },
            {
                Email: 'xxxlol@protonmail.com',
                Type: ['WORK']
            }
        ]
    }));


    describe('Many times the same email but diff types', scenario({
        testCard: cardManySameEmailsDiffTypes,
        contactEmails: [
            {
                Email: 'xxxlol@protonmail.com',
                Type: ['home']
            },
            {
                Email: 'xxxlol@protonmail.com',
                Type: ['other']
            }
        ]
    }, 'sameEmailsDiffTypes'));

    describe('Remove all emails for contacts with many emails', scenario({
        testCard: cardManySameEmailsDiffTypes,
        contactEmails: [
            {
                Email: 'xxxlol@protonmail.com',
                Type: ['home']
            },
            {
                Email: 'xxxlol@protonmail.com',
                Type: ['other']
            },
            {
                Email: 'xxxlol@protonmail.com',
                Type: ['email']
            },
            {
                Email: 'xxxlol@protonmail.com',
                Type: ['work']
            }
        ]
    }, 'removeAllContactMany'));

    describe('Many emails ~ wrong map', scenario({
        testCard: cardManyEmailsGroupedFields,
        contactEmails: [
            {
                Email: 'xxxlol2@pm.me',
                Type: ['email']
            },
            {
                Email: 'xxxlol2@protonmail.com',
                Type: ['email']
            }
        ]
    }, 'wrongMap'));

    describe('Many emails ~ wrong type mixed', scenario({
        testCard: cardManyEmailsGroupedFields,
        contactEmails: [
            {
                Email: 'xxxlol@pm.me',
                Type: ['home']
            },
            {
                Email: 'xxxlol@protonmail.com',
                Type: ['email']
            }
        ]
    }, 'wrongTypeMixed'));

});

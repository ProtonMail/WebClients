import { prepareForEdition, prepareForSaving } from '@proton/shared/lib/contacts/surgery';
import { VCardContact, VCardGender } from '@proton/shared/lib/interfaces/contacts/VCard';

describe('surgery', () => {
    describe('prepareForEdition', () => {
        describe('when there are missing `fn`,`n` ,`photo` and `email` fields', () => {
            it('should push properties with empty values', () => {
                const formattedVcard = prepareForEdition({ fn: [] });

                expect(formattedVcard).toEqual({
                    fn: [
                        {
                            field: 'fn',
                            value: '',
                            uid: 'contact-property-0',
                        },
                    ],
                    photo: [
                        {
                            field: 'photo',
                            value: '',
                            uid: 'contact-property-1',
                        },
                    ],
                    email: [
                        {
                            field: 'email',
                            value: '',
                            uid: 'contact-property-2',
                        },
                    ],
                    n: {
                        field: 'n',
                        value: {
                            familyNames: [''],
                            givenNames: [''],
                            additionalNames: [''],
                            honorificPrefixes: [''],
                            honorificSuffixes: [''],
                        },
                        uid: 'contact-property-3',
                    },
                });
            });
        });
    });

    describe('prepareForSaving', () => {
        const contactWithInvalidValues: VCardContact = {
            fn: [
                {
                    field: 'fn',
                    value: 'Albert Delabatte',
                    uid: 'test-1',
                },
            ],
            adr: [
                {
                    field: 'adr',
                    value: {
                        postalCode: '',
                        postOfficeBox: '',
                        extendedAddress: '',
                        streetAddress: '',
                        locality: '',
                        region: '',
                        country: '',
                    },
                    uid: 'test-2',
                },
            ],
            bday: {
                field: 'bday',
                value: { date: 'Monday 30 october' as unknown as Date },
                uid: 'test-3',
            },
            anniversary: {
                field: 'anniversary',
                value: { date: 'Monday 30 october' as unknown as Date },
                uid: 'test-4',
            },
            gender: {
                field: 'gender',
                value: { gender: VCardGender.Empty, text: '' },
                uid: 'test-5',
            },
        };

        const contactWithArrayValuedCategories = {
            ...contactWithInvalidValues,
            categories: [
                {
                    field: 'categories',
                    value: ['CATEGORYA', 'CATEGORYB'],
                    uid: 'test-6',
                },
                {
                    field: 'categories',
                    value: ['CATEGORYC'],
                    uid: 'test-7',
                },
                {
                    field: 'categories',
                    value: ['CATEGORYD', 'CATEGORYE'],
                    uid: 'test-8',
                },
            ],
        } as any;

        const contactWithPrefFields: VCardContact = {
            ...contactWithInvalidValues,
            fn: [
                {
                    field: 'fn',
                    value: 'Albert Delabatte',
                    uid: 'test-1',
                    params: {
                        pref: '1',
                    },
                },
                {
                    field: 'fn',
                    value: 'Albert Delatour',
                    uid: 'test-17',
                    params: {
                        pref: '6',
                    },
                },
            ],
            email: [
                {
                    field: 'email',
                    value: 'testa@protontech.tech',
                    uid: 'test-9',
                    params: {
                        pref: '2',
                    },
                },
                {
                    field: 'email',
                    value: 'testb@protontech.tech',
                    uid: 'test-10',
                    params: {
                        pref: '4',
                    },
                },
            ],
            adr: [
                {
                    field: 'adr',
                    value: {
                        postalCode: '92504',
                        postOfficeBox: '',
                        extendedAddress: '',
                        streetAddress: '3578 Adams St',
                        locality: 'Riverside',
                        region: 'California',
                        country: 'United States',
                    },
                    uid: 'test-11',
                    params: {
                        pref: '4',
                    },
                },
                {
                    field: 'adr',
                    value: {
                        postalCode: '22801',
                        postOfficeBox: '',
                        extendedAddress: '',
                        streetAddress: '1925 E Market St #0208',
                        locality: 'Harrisonburg',
                        region: 'Vermont',
                        country: 'United States',
                    },
                    uid: 'test-12',
                    params: {
                        pref: '5',
                    },
                },
            ],
            tel: [
                {
                    field: 'tel',
                    value: '(540) 438-8458',
                    uid: 'test-13',
                    params: {
                        pref: '1',
                    },
                },
                {
                    field: 'tel',
                    value: '(516) 825-7912',
                    uid: 'test-14',
                    params: {
                        pref: '3',
                    },
                },
            ],
            key: [
                {
                    field: 'key',
                    value: '-- FAKE_KEY A --',
                    uid: 'test-15',
                    params: {
                        pref: '3',
                    },
                },

                {
                    field: 'key',
                    value: '-- FAKE_KEY B --',
                    uid: 'test-16',
                    params: {
                        pref: '2',
                    },
                },
            ],
        };

        const contactWithEmailFieldsWithoutGroups: VCardContact = {
            ...contactWithInvalidValues,
            email: [
                {
                    field: 'email',
                    value: 'testa@protontech.tech',
                    uid: 'test-9',
                    params: {
                        pref: '2',
                    },
                },
                {
                    field: 'email',
                    value: 'testb@protontech.tech',
                    uid: 'test-10',
                    params: {
                        pref: '4',
                    },
                },
            ],
        };

        describe('when there are invalid values', () => {
            it('should filter them out', () => {
                const formattedContact = prepareForSaving(contactWithInvalidValues);

                expect(formattedContact).toEqual({
                    fn: [
                        {
                            field: 'fn',
                            value: 'Albert Delabatte',
                            uid: 'test-1',
                            params: {
                                pref: '1',
                            },
                        },
                    ],
                });
            });
        });

        describe('when there are array-valued categories properties', () => {
            it('should flatten them', () => {
                const formattedContact = prepareForSaving(contactWithArrayValuedCategories);

                expect(formattedContact).toEqual({
                    fn: [
                        {
                            field: 'fn',
                            value: 'Albert Delabatte',
                            uid: 'test-1',
                            params: {
                                pref: '1',
                            },
                        },
                    ],
                    categories: [
                        {
                            field: 'categories',
                            value: 'CATEGORYA',
                            uid: 'test-6',
                        },
                        {
                            field: 'categories',
                            value: 'CATEGORYB',
                            uid: 'test-6',
                        },
                        {
                            field: 'categories',
                            value: 'CATEGORYC',
                            uid: 'test-7',
                        },
                        {
                            field: 'categories',
                            value: 'CATEGORYD',
                            uid: 'test-8',
                        },
                        {
                            field: 'categories',
                            value: 'CATEGORYE',
                            uid: 'test-8',
                        },
                    ],
                });
            });
        });

        describe('when there are field with pref params', () => {
            it('should sort by pref and recompute pref index', () => {
                const formattedContact = prepareForSaving(contactWithPrefFields);

                expect(formattedContact).toEqual({
                    fn: [
                        {
                            field: 'fn',
                            value: 'Albert Delabatte',
                            uid: 'test-1',
                            params: {
                                pref: '1',
                            },
                        },
                        {
                            field: 'fn',
                            value: 'Albert Delatour',
                            uid: 'test-17',
                            params: {
                                pref: '2',
                            },
                        },
                    ],
                    adr: [
                        {
                            field: 'adr',
                            value: {
                                postalCode: '92504',
                                postOfficeBox: '',
                                extendedAddress: '',
                                streetAddress: '3578 Adams St',
                                locality: 'Riverside',
                                region: 'California',
                                country: 'United States',
                            },
                            uid: 'test-11',
                            params: {
                                pref: '1',
                            },
                        },
                        {
                            field: 'adr',
                            value: {
                                postalCode: '22801',
                                postOfficeBox: '',
                                extendedAddress: '',
                                streetAddress: '1925 E Market St #0208',
                                locality: 'Harrisonburg',
                                region: 'Vermont',
                                country: 'United States',
                            },
                            uid: 'test-12',
                            params: {
                                pref: '2',
                            },
                        },
                    ],
                    email: [
                        {
                            field: 'email',
                            value: 'testa@protontech.tech',
                            uid: 'test-9',
                            params: {
                                pref: '1',
                            },
                            group: 'item1',
                        },
                        {
                            field: 'email',
                            value: 'testb@protontech.tech',
                            uid: 'test-10',
                            params: {
                                pref: '2',
                            },
                            group: 'item2',
                        },
                    ],
                    tel: [
                        {
                            field: 'tel',
                            value: '(540) 438-8458',
                            uid: 'test-13',
                            params: {
                                pref: '1',
                            },
                        },
                        {
                            field: 'tel',
                            value: '(516) 825-7912',
                            uid: 'test-14',
                            params: {
                                pref: '2',
                            },
                        },
                    ],
                    key: [
                        {
                            field: 'key',
                            value: '-- FAKE_KEY B --',
                            uid: 'test-16',
                            params: {
                                pref: '1',
                            },
                        },
                        {
                            field: 'key',
                            value: '-- FAKE_KEY A --',
                            uid: 'test-15',
                            params: {
                                pref: '2',
                            },
                        },
                    ],
                });
            });
        });

        describe("when some email properties don't have `group` attribute", () => {
            it('should add group to the properties', () => {
                const formattedContact = prepareForSaving(contactWithEmailFieldsWithoutGroups);

                expect(formattedContact).toEqual({
                    fn: [
                        {
                            field: 'fn',
                            value: 'Albert Delabatte',
                            uid: 'test-1',
                            params: {
                                pref: '1',
                            },
                        },
                    ],
                    email: [
                        {
                            field: 'email',
                            value: 'testa@protontech.tech',
                            uid: 'test-9',
                            params: {
                                pref: '1',
                            },
                            group: 'item1',
                        },
                        {
                            field: 'email',
                            value: 'testb@protontech.tech',
                            uid: 'test-10',
                            params: {
                                pref: '2',
                            },
                            group: 'item2',
                        },
                    ],
                });
            });
        });
    });
});

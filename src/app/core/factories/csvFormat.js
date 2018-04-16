import _ from 'lodash';

import { flow, filter, head } from 'lodash/fp';

/* @ngInject */
function csvFormat() {
    const PROPERTIES = {
        adr: [], // NOTE Too complex to be defined here
        anniversary: ['Anniversary'],
        bday: ['Birthday'],
        email: [
            'E-mail Address',
            'E-mail 2 Address',
            'E-mail 3 Address',
            'Email',
            'Alternate Email 1',
            'Alternate Email 2',
            'Primary Email',
            'Secondary Email'
        ],
        fn: [], // NOTE Too complex to be defined here
        gender: ['Gender'],
        geo: ['Geolocation', 'Location'],
        impp: ['Impp'],
        lang: ['Language'],
        logo: ['Logo'],
        member: ['Membmer', 'Group Membership'],
        nickname: ['Nickname', 'Display Name', 'Screen Name'],
        note: ['Notes', 'Note'],
        org: ['Company', 'Organization', 'Department'],
        photo: ['Photo', 'Avatar'],
        prodid: ['Software'],
        rev: ['Revision'],
        role: ['Role'],
        sound: ['Sound'],
        tel: ['Primary Phone', 'Other Phone', 'Radio Phone', 'Other', 'Yahoo Phone'],
        title: ['Title', 'Job Title', 'JobTitle'],
        tz: ['Timezone', 'TimeZone'],
        uid: ['UID'],
        url: ['URL', 'Web Page', 'Personal Website', 'Business Website', 'Website', 'Web Page 1', 'Web Page 2', 'Personal Web Page']
    };

    const PHONES = {
        Home: ['Home Phone', 'Home Phone 2'],
        Work: ['Work Phone', 'Company Main Phone', 'Business Phone', 'Business Phone 2'],
        Mobile: ['Mobile', 'Mobile Number', 'Mobile Phone'],
        Fax: ['Fax', 'Fax Number', 'Home Fax', 'Business Fax', 'Other Fax', 'Telex'],
        Pager: ['Pager', 'Pager Number'],
        Car: ['Car Phone']
    };

    const parameters = {
        Fax: ['Fax'],
        Home: ['Home'],
        Work: ['Work', 'Business'],
        Mobile: ['Mobile'],
        Personal: ['Personal', 'Perso', 'Main', 'Primary']
    };

    const getParameter = (key = '') => {
        return flow(filter((param) => parameters[param].filter((value) => key.indexOf(value) > -1).length > 0), head)(Object.keys(parameters));
    };

    const extractKeys = (keys = [], contact = {}) => {
        return keys.reduce((acc, key) => {
            const value = contact[key];

            if (value) {
                const property = { value: value.toString() };
                const parameter = getParameter(key);

                if (parameter) {
                    property.parameter = parameter;
                }

                acc.push(property);
            }

            return acc;
        }, []);
    };

    /*
        the post office box;
        the extended address (e.g., apartment or suite number);
        the street address;
        the locality (e.g., city);
        the region (e.g., state or province);
        the postal code;
        the country name (full name in the language specified in
        */

    const extractAddress = (contact, type) => {
        const address = contact[`${type} Address`] || contact[`${type} Street`] || '';
        const address2 = contact[`${type} Address 2`] || contact[`${type} Street 2`] || '';
        const city = contact[`${type} City`] || '';
        const state = contact[`${type} State`] || '';
        const zipCode = contact[`${type} ZipCode`] || contact[`${type} Postal Code`] || contact[`${type} ZIP`] || '';
        const country = contact[`${type} Country`] || contact[`${type} Country/Region`] || '';
        const value = ['', address2, address, city, state, zipCode, country];

        return value.join('').trim().length ? value.join(';').trim() : '';
    };

    const getAllProperties = () => Object.keys(PROPERTIES);
    const anniversary = (contact) => extractKeys(PROPERTIES.anniversary, contact);
    const gender = (contact) => extractKeys(PROPERTIES.gender, contact);
    const geo = (contact) => extractKeys(PROPERTIES.geo, contact);
    const impp = (contact) => extractKeys(PROPERTIES.impp, contact);
    const lang = (contact) => extractKeys(PROPERTIES.lang, contact);
    const logo = (contact) => extractKeys(PROPERTIES.logo, contact);
    const member = (contact) => extractKeys(PROPERTIES.member, contact);
    const nickname = (contact) => extractKeys(PROPERTIES.nickname, contact);
    const note = (contact) => extractKeys(PROPERTIES.note, contact);
    const org = (contact) => extractKeys(PROPERTIES.org, contact);
    const photo = (contact) => extractKeys(PROPERTIES.photo, contact);
    const prodid = (contact) => extractKeys(PROPERTIES.prodid, contact);
    const rev = (contact) => extractKeys(PROPERTIES.csv, contact);
    const role = (contact) => extractKeys(PROPERTIES.role, contact);
    const sound = (contact) => extractKeys(PROPERTIES.sound, contact);
    const title = (contact) => extractKeys(PROPERTIES.title, contact);
    const tz = (contact) => extractKeys(PROPERTIES.tz, contact);
    const uid = (contact) => extractKeys(PROPERTIES.uid, contact);
    const url = (contact) => extractKeys(PROPERTIES.url, contact);

    const adr = (contact) => {
        const addresses = [];

        _.each(['Home', 'Work', 'Business', 'Other'], (type) => {
            const value = extractAddress(contact, type);

            if (value) {
                addresses.push({ value, type });
            }
        });

        if (contact['Address 1 - Formatted']) {
            const address = { value: contact['Address 1 - Formatted'] };

            if (contact['Address 2 - Type']) {
                address.parameter = contact['Address 1 - Type'];
            }

            addresses.push(address);
        }

        if (contact['Address 2 - Formatted']) {
            const address = { value: contact['Address 2 - Formatted'] };

            if (contact['Address 2 - Type']) {
                address.parameter = contact['Address 2 - Type'];
            }

            addresses.push(address);
        }

        if (contact['Address 3 - Formatted']) {
            const address = { value: contact['Address 3 - Formatted'] };

            if (contact['Address 3 - Type']) {
                address.parameter = contact['Address 3 - Type'];
            }

            addresses.push(address);
        }

        return addresses;
    };

    const bday = (contact) => {
        const bdays = extractKeys(PROPERTIES.bday, contact);
        const year = contact['Birth Year'];
        const month = contact['Birth Month'];
        const day = contact['Birth Day'];

        if (year && month && day) {
            bdays.push(`${year}-${month}-${day}`);
        }

        return bdays;
    };

    const email = (contact) => {
        const emails = extractKeys(PROPERTIES.email, contact);

        if (contact['E-mail 1 - Value']) {
            const email = { value: contact['E-mail 1 - Value'] };

            if (contact['E-mail 1 - Type']) {
                email.parameter = contact['E-mail 1 - Type'];
            }

            emails.push(email);
        }

        if (contact['E-mail 2 - Value']) {
            const email = { value: contact['E-mail 2 - Value'] };

            if (contact['E-mail 2 - Type']) {
                email.parameter = contact['E-mail 2 - Type'];
            }

            emails.push(email);
        }

        if (contact['E-mail 3 - Value']) {
            const email = { value: contact['E-mail 3 - Value'] };

            if (contact['E-mail 3 - Type']) {
                email.parameter = contact['E-mail 3 - Type'];
            }

            emails.push(email);
        }

        return emails;
    };

    const fn = (contact) => {
        const fullnames = [];
        const name = [];

        if (contact.First) {
            name.push(contact.First);
        }

        if (contact.Name) {
            name.push(contact.Name);
        }

        if (contact.Middle) {
            name.push(contact.Middle);
        }

        if (contact.Last) {
            name.push(contact.Last);
        }

        if (contact['First Name']) {
            name.push(contact['First Name']);
        }

        if (contact['Middle Name']) {
            name.push(contact['Middle Name']);
        }

        if (contact['Last Name']) {
            name.push(contact['Last Name']);
        }

        if (name.length) {
            fullnames.push({ value: name.join(' ') });
        }

        return fullnames;
    };

    const tel = (contact) => {
        const tels = extractKeys(PROPERTIES.tel, contact);

        Object.keys(PHONES).forEach((parameter) => {
            PHONES[parameter].forEach((key) => {
                const value = contact[key];
                if (value) {
                    tels.push({ value, parameter });
                }
            });
        });

        if (contact['Phone 1 - Value']) {
            const tel = { value: contact['Phone 1 - Value'] };

            if (contact['Phone 1 - Type']) {
                tel.parameter = contact['Phone 1 - Type'];
            }

            tels.push(tel);
        }

        if (contact['Phone 2 - Value']) {
            const tel = { value: contact['Phone 2 - Value'] };

            if (contact['Phone 2 - Type']) {
                tel.parameter = contact['Phone 2 - Type'];
            }

            tels.push(tel);
        }

        if (contact['Phone 3 - Value']) {
            const tel = { value: contact['Phone 3 - Value'] };

            if (contact['Phone 3 - Type']) {
                tel.parameter = contact['Phone 3 - Type'];
            }

            tels.push(tel);
        }

        return tels;
    };

    return {
        getAllProperties,
        adr,
        anniversary,
        bday,
        email,
        fn,
        gender,
        geo,
        impp,
        lang,
        logo,
        member,
        nickname,
        note,
        org,
        photo,
        prodid,
        rev,
        role,
        sound,
        tel,
        title,
        tz,
        uid,
        url
    };
}

export default csvFormat;

import _ from 'lodash';

import { flow, filter, head } from 'lodash/fp';

const PROPERTIES = {
    adr: [], // NOTE Too complex to be defined here
    anniversary: ['anniversary'],
    bday: ['birthday'],
    email: [
        'e-mail address',
        'e-mail 2 address',
        'e-mail 3 address',
        'email',
        'alternate email 1',
        'alternate email 2',
        'primary email',
        'secondary email'
    ],
    fn: [], // NOTE Too complex to be defined here
    gender: ['gender'],
    geo: ['geolocation', 'location'],
    impp: ['impp'],
    lang: ['language'],
    logo: ['logo'],
    member: ['membmer', 'group membership'],
    nickname: ['nickname', 'display name', 'screen name'],
    note: ['notes', 'note'],
    org: ['company', 'organization', 'department'],
    photo: ['photo', 'avatar'],
    prodid: ['software'],
    rev: ['revision'],
    role: ['role'],
    sound: ['sound'],
    tel: ['primary phone', 'other phone', 'radio phone', 'other', 'yahoo phone'],
    title: ['title', 'job title', 'jobtitle'],
    tz: ['timezone'],
    uid: ['uid'],
    url: [
        'url',
        'web page',
        'personal website',
        'business website',
        'website',
        'web page 1',
        'web page 2',
        'personal web page'
    ]
};

const PHONES = {
    Home: ['home phone', 'home phone 2', 'voice'],
    Work: ['work phone', 'company main phone', 'business phone', 'business phone 2', 'telephone work'],
    Mobile: ['mobile', 'mobile number', 'mobile phone', 'x-mobile'],
    Fax: ['fax', 'fax number', 'home fax', 'business fax', 'other fax', 'telex'],
    Pager: ['pager', 'pager number'],
    Car: ['car phone']
};

const parameters = {
    Fax: ['Fax'],
    Home: ['Home'],
    Work: ['Work', 'Business'],
    Mobile: ['Mobile'],
    Personal: ['Personal', 'Perso', 'Main', 'Primary']
};

const getParameter = (key = '') => {
    return flow(
        filter((param) => parameters[param].filter((value) => key.indexOf(value) > -1).length > 0),
        head
    )(Object.keys(parameters));
};

const extractKeys = (keys = [], contact = {}) => {
    return keys.reduce((acc, key = '') => {
        const value = contact[key.toLowerCase()];

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
    const address = contact[`${type} address`] || contact[`${type} street`] || '';
    const address2 = contact[`${type} address 2`] || contact[`${type} street 2`] || '';
    const city = contact[`${type} city`] || '';
    const state = contact[`${type} state`] || '';
    const zipCode = contact[`${type} zipcode`] || contact[`${type} postal code`] || contact[`${type} zip`] || '';
    const country = contact[`${type} country`] || contact[`${type} country/region`] || '';
    const value = ['', address2, address, city, state, zipCode, country];

    return value.join('').trim().length ? value.join(';').trim() : '';
};

export const getAllProperties = () => Object.keys(PROPERTIES);

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

    _.each(['home', 'work', 'business', 'other'], (type) => {
        const value = extractAddress(contact, type);

        if (value) {
            addresses.push({ value, parameter: type });
        }
    });

    if (contact['address 1 - formatted']) {
        const address = { value: contact['address 1 - formatted'] };

        if (contact['address 1 - type']) {
            address.parameter = contact['address 1 - type'];
        }

        addresses.push(address);
    }

    if (contact['address 2 - formatted']) {
        const address = { value: contact['address 2 - formatted'] };

        if (contact['address 2 - type']) {
            address.parameter = contact['address 2 - type'];
        }

        addresses.push(address);
    }

    if (contact['address 3 - formatted']) {
        const address = { value: contact['address 3 - formatted'] };

        if (contact['address 3 - type']) {
            address.parameter = contact['address 3 - type'];
        }

        addresses.push(address);
    }

    return addresses;
};

const bday = (contact) => {
    const bdays = extractKeys(PROPERTIES.bday, contact);
    const year = contact['birth year'];
    const month = contact['birth month'];
    const day = contact['birth day'];

    if (year && month && day) {
        bdays.push({ value: `${year}-${month}-${day}` });
    }

    return bdays;
};

const email = (contact) => {
    const emails = extractKeys(PROPERTIES.email, contact);

    if (contact['e-mail 1 - value']) {
        const email = { value: contact['e-mail 1 - value'] };

        if (contact['e-mail 1 - type']) {
            email.parameter = contact['e-mail 1 - type'];
        }

        emails.push(email);
    }

    if (contact['e-mail 2 - value']) {
        const email = { value: contact['e-mail 2 - value'] };

        if (contact['e-mail 2 - type']) {
            email.parameter = contact['e-mail 2 - type'];
        }

        emails.push(email);
    }

    if (contact['e-mail 3 - value']) {
        const email = { value: contact['e-mail 3 - value'] };

        if (contact['e-mail 3 - type']) {
            email.parameter = contact['e-mail 3 - type'];
        }

        emails.push(email);
    }

    return emails;
};

const fn = (contact) => {
    const fullnames = [];
    const names = [];

    if (contact.first) {
        names.push(contact.first);
    }

    if (contact.name) {
        names.push(contact.name);
    }

    if (contact.middle) {
        names.push(contact.middle);
    }

    if (contact.last) {
        names.push(contact.last);
    }

    if (contact['first name']) {
        names.push(contact['first name']);
    }

    if (contact['middle name']) {
        names.push(contact['middle name']);
    }

    if (contact['last name']) {
        names.push(contact['last name']);
    }

    if (names.length) {
        fullnames.push({ value: names.join(' ') });
    }

    return fullnames;
};

const tel = (contact) => {
    const tels = extractKeys(PROPERTIES.tel, contact);
    Object.keys(PHONES).forEach((parameter) => {
        PHONES[parameter].forEach((key) => {
            const value = contact[key.toLowerCase()];
            if (value) {
                tels.push({ value, parameter });
            }
        });
    });

    if (contact['phone 1 - value']) {
        const tel = { value: contact['phone 1 - value'] };

        if (contact['phone 1 - type']) {
            tel.parameter = contact['phone 1 - type'];
        }

        tels.push(tel);
    }

    if (contact['phone 2 - value']) {
        const tel = { value: contact['phone 2 - value'] };

        if (contact['phone 2 - type']) {
            tel.parameter = contact['phone 2 - type'];
        }

        tels.push(tel);
    }

    if (contact['phone 3 - value']) {
        const tel = { value: contact['phone 3 - value'] };

        if (contact['phone 3 - type']) {
            tel.parameter = contact['phone 3 - type'];
        }

        tels.push(tel);
    }

    return tels;
};

export const keys = {
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

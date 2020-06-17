import { c } from 'ttag';

export const getAllFields = () => [
    { text: c('Contact field label').t`Name`, value: 'fn' },
    { text: c('Contact field label').t`Compact name`, value: 'n' },
    { text: c('Contact field label').t`Nickname`, value: 'nickname' },
    { text: c('Contact field label').t`Email`, value: 'email' },
    { text: c('Contact field label').t`Phone`, value: 'tel' },
    { text: c('Contact field label').t`Address`, value: 'adr' },
    { text: c('Contact field label').t`Photo`, value: 'photo' },
    { text: c('Contact field label').t`Organization`, value: 'org' },
    { text: c('Contact field label').t`Birthday`, value: 'bday' },
    { text: c('Contact field label').t`Anniversary`, value: 'anniversary' },
    { text: c('Contact field label').t`Title`, value: 'title' },
    { text: c('Contact field label').t`Role`, value: 'role' },
    { text: c('Contact field label').t`Note`, value: 'note' },
    { text: c('Contact field label').t`URL`, value: 'url' },
    { text: c('Contact field label').t`Gender`, value: 'gender' },
    { text: c('Contact field label').t`Language`, value: 'lang' },
    { text: c('Contact field label').t`Timezone`, value: 'tz' },
    { text: c('Contact field label').t`Geo`, value: 'geo' },
    { text: c('Contact field label').t`Logo`, value: 'logo' },
    { text: c('Contact field label').t`Member`, value: 'member' },
    { text: c('Contact field label').t`IMPP`, value: 'impp' },
    { text: c('Contact field label').t`Related`, value: 'related' },
    { text: c('Contact field label').t`Categories`, value: 'categories' },
    { text: c('Contact field label').t`Sound`, value: 'sound' }
];

export const getEditableFields = () => [
    { text: c('Contact field label').t`Name`, value: 'fn' },
    { text: c('Contact field label').t`Email`, value: 'email' },
    { text: c('Contact field label').t`Phone`, value: 'tel' },
    { text: c('Contact field label').t`Address`, value: 'adr' },
    { text: c('Contact field label').t`Photo`, value: 'photo' },
    { text: c('Contact field label').t`Organization`, value: 'org' },
    { text: c('Contact field label').t`Birthday`, value: 'bday' },
    { text: c('Contact field label').t`Anniversary`, value: 'anniversary' },
    { text: c('Contact field label').t`Title`, value: 'title' },
    { text: c('Contact field label').t`Role`, value: 'role' },
    { text: c('Contact field label').t`Member`, value: 'member' },
    { text: c('Contact field label').t`Note`, value: 'note' },
    { text: c('Contact field label').t`URL`, value: 'url' },
    { text: c('Contact field label').t`Gender`, value: 'gender' },
    { text: c('Contact field label').t`Language`, value: 'lang' },
    { text: c('Contact field label').t`Timezone`, value: 'tz' },
    { text: c('Contact field label').t`Geo`, value: 'geo' },
    { text: c('Contact field label').t`Logo`, value: 'logo' }
];
export const getOtherInformationFields = () => [
    { text: c('Contact field label').t`Photo`, value: 'photo' },
    { text: c('Contact field label').t`Organization`, value: 'org' },
    { text: c('Contact field label').t`Birthday`, value: 'bday' },
    { text: c('Contact field label').t`Anniversary`, value: 'anniversary' },
    { text: c('Contact field label').t`Title`, value: 'title' },
    { text: c('Contact field label').t`Role`, value: 'role' },
    { text: c('Contact field label').t`Member`, value: 'member' },
    { text: c('Contact field label').t`Note`, value: 'note' },
    { text: c('Contact field label').t`URL`, value: 'url' },
    { text: c('Contact field label').t`Gender`, value: 'gender' },
    { text: c('Contact field label').t`Language`, value: 'lang' },
    { text: c('Contact field label').t`Timezone`, value: 'tz' },
    { text: c('Contact field label').t`Geo`, value: 'geo' },
    { text: c('Contact field label').t`Logo`, value: 'logo' }
];

export const getAllFieldLabels = () => ({
    fn: c('Contact field label').t`Name`,
    n: c('Contact field label').t`Compact name`,
    nickname: c('Contact field label').t`Nickname`,
    email: c('Contact field label').t`Email`,
    tel: c('Contact field label').t`Phone`,
    adr: c('Contact field label').t`Address`,
    photo: c('Contact field label').t`Photo`,
    org: c('Contact field label').t`Organization`,
    bday: c('Contact field label').t`Birthday`,
    anniversary: c('Contact field label').t`Anniversary`,
    title: c('Contact field label').t`Title`,
    role: c('Contact field label').t`Role`,
    note: c('Contact field label').t`Note`,
    url: c('Contact field label').t`URL`,
    gender: c('Contact field label').t`Gender`,
    lang: c('Contact field label').t`Language`,
    tz: c('Contact field label').t`Timezone`,
    geo: c('Contact field label').t`Geo`,
    logo: c('Contact field label').t`Logo`,
    member: c('Contact field label').t`Member`,
    impp: c('Contact field label').t`IMPP`,
    related: c('Contact field label').t`Related`,
    categories: c('Contact field label').t`Categories`,
    sound: c('Contact field label').t`Sound`
});

// ** NOT USED FOR THE MOMENT **
// export const getIcons = () => ({
//     email: 'email',
//     org: 'organization',
//     tel: 'phone',
//     adr: 'address',
//     bday: 'birthday',
//     anniversary: 'anniversary',
//     title: 'title',
//     role: 'role',
//     note: 'note',
//     url: 'domains',
//     gender: 'gender',
//     lang: 'alias', // TODO icon missing
//     tz: 'alias', // TODO icon missing
//     geo: 'domains',
//     logo: 'photo',
//     member: 'member-contact'
// });

export const getTypeLabels = () => ({
    work: c('Contact type label').t`Work`,
    home: c('Contact type label').t`Personal`,
    cell: c('Contact type label').t`Mobile`,
    main: c('Contact type label').t`Main`,
    yomi: c('Contact type label').t`Yomi`,
    other: c('Contact type label').t`Other`,
    fax: c('Contact type label').t`Fax`,
    pager: c('Contact type label').t`Pager`
});

export const getAllTypes = () => ({
    fn: [
        { text: c('Property type').t`Name`, value: '' },
        { text: c('Property type').t`Yomi`, value: 'yomi' }
    ],
    n: [],
    nickname: [],
    email: [
        { text: c('Property type').t`Email`, value: '' },
        { text: c('Property type').t`Home`, value: 'home' },
        { text: c('Property type').t`Work`, value: 'work' },
        { text: c('Property type').t`Other`, value: 'other' }
    ],
    tel: [
        { text: c('Property type').t`Phone`, value: '' },
        { text: c('Property type').t`Home`, value: 'home' },
        { text: c('Property type').t`Work`, value: 'work' },
        { text: c('Property type').t`Other`, value: 'other' },
        { text: c('Property type').t`Mobile`, value: 'cell' },
        { text: c('Property type').t`Main`, value: 'main' },
        { text: c('Property type').t`Fax`, value: 'fax' },
        { text: c('Property type').t`Pager`, value: 'pager' }
    ],
    adr: [
        { text: c('Property type').t`Address`, value: '' },
        { text: c('Property type').t`Home`, value: 'home' },
        { text: c('Property type').t`Work`, value: 'work' },
        { text: c('Property type').t`Other`, value: 'other' }
    ],
    bday: [],
    anniversary: [],
    gender: [],
    lang: [],
    tz: [],
    geo: [],
    title: [],
    role: [],
    logo: [],
    photo: [],
    org: [],
    related: [
        { text: c('Property type').t`Contact`, value: 'contact' },
        { text: c('Property type').t`Acquaintance`, value: 'acquaintance' },
        { text: c('Property type').t`Friend`, value: 'friend' },
        { text: c('Property type').t`Met`, value: 'met' },
        { text: c('Property type').t`Co-worker`, value: 'co-worker' },
        { text: c('Property type').t`Colleague`, value: 'colleague' },
        { text: c('Property type').t`Co-resident`, value: 'co-resident' },
        { text: c('Property type').t`Neighbor`, value: 'neighbor' },
        { text: c('Property type').t`Child`, value: 'child' },
        { text: c('Property type').t`Parent`, value: 'parent' },
        { text: c('Property type').t`Sibling`, value: 'sibling' },
        { text: c('Property type').t`Sibling`, value: 'spouse' },
        { text: c('Property type').t`Kin`, value: 'kin' },
        { text: c('Property type').t`Muse`, value: 'muse' },
        { text: c('Property type').t`Crush`, value: 'crush' },
        { text: c('Property type').t`Date`, value: 'date' },
        { text: c('Property type').t`Sweetheart`, value: 'sweetheart' },
        { text: c('Property type').t`Me`, value: 'me' },
        { text: c('Property type').t`Agent`, value: 'agent' },
        { text: c('Property type').t`Emergency`, value: 'emergency' }
    ],
    member: [],
    note: [],
    url: []
});

export const getTypeValues = () => ({
    fn: ['', 'yomi'],
    n: [],
    nickname: [],
    email: ['', 'home', 'work', 'other'],
    tel: ['', 'home', 'work', 'other', 'cell', 'main', 'fax', 'pager'],
    adr: ['', 'home', 'work', 'other'],
    bday: [],
    anniversary: [],
    gender: [],
    lang: [],
    tz: [],
    geo: [],
    title: [],
    role: [],
    logo: [],
    org: [],
    related: [
        'contact',
        'acquaintance',
        'friend',
        'met',
        'co-worker',
        'colleague',
        'co-resident',
        'neighbor',
        'child',
        'parent',
        'sibling',
        'spouse',
        'kin',
        'muse',
        'crush',
        'date',
        'sweetheart',
        'me',
        'agent',
        'emergency'
    ],
    member: [],
    note: [],
    url: []
});

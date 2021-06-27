import { c } from 'ttag';

export const getAllFields = () => [
    // translator: this field is used to specify the full name of the contact (e.g. Jane Appleseed)
    { text: c('Contact field label').t`Name`, value: 'fn' },
    // translator: this field is used to specify the email of the contact (e.g. jane.appleseed@pm.me)
    { text: c('Contact field label').t`Email`, value: 'email' },
    // translator: this field is used to specify the phone number of the contact
    { text: c('Contact field label').t`Phone`, value: 'tel' },
    // translator: this field is used to specify the address of the contact
    { text: c('Contact field label').t`Address`, value: 'adr' },
    // translator: this field is used to add a picture for the contact
    { text: c('Contact field label').t`Photo`, value: 'photo' },
    // translator: this field is used to specify the organization's name of the contact
    { text: c('Contact field label').t`Organization`, value: 'org' },
    // translator: this field is used to specify the birth date of the contact
    { text: c('Contact field label').t`Birthday`, value: 'bday' },
    // translator: this field is used to specify the anniversary date of the contact (e.g. marriage, or equivalent)
    { text: c('Contact field label').t`Anniversary`, value: 'anniversary' },
    // translator: this field is used to specify the position or job of the contact
    { text: c('Contact field label').t`Title`, value: 'title' },
    // translator: this field is used to specify the specific role of the contact given the type of relationship with the user
    { text: c('Contact field label').t`Role`, value: 'role' },
    // translator: this field is used to add a note about the contact
    { text: c('Contact field label').t`Note`, value: 'note' },
    // translator: this field is used to add a URL for the contact
    { text: c('Contact field label').t`URL`, value: 'url' },
    // translator: this field is used to specify the gender of the contact
    { text: c('Contact field label').t`Gender`, value: 'gender' },
    // translator: this field is used to specify the primary language of the contact
    { text: c('Contact field label').t`Language`, value: 'lang' },
    // translator: this field is used to specify the timezone of the contact
    { text: c('Contact field label').t`Timezone`, value: 'tz' },
    // translator: this field is used to specify geographic information about the contact (e.g. latitude + longitude)
    { text: c('Contact field label').t`Geo`, value: 'geo' },
    // translator: this field is used to add a logo for the contact
    { text: c('Contact field label').t`Logo`, value: 'logo' },
    // translator: this field is used to specify the group a contact would be a member of
    { text: c('Contact field label').t`Member`, value: 'member' },
    // translator: this field is used to apply categories / tags to the contacts
    { text: c('Contact field label').t`Categories`, value: 'categories' },
];

export const getEditableFields = () => [
    { text: c('Contact field label').t`Name`, value: 'fn' },
    { text: c('Contact field label').t`Email`, value: 'email' },
    { text: c('Contact field label').t`Phone`, value: 'tel' },
    { text: c('Contact field label').t`Address`, value: 'adr' },
    { text: c('Contact field label').t`Photo`, value: 'photo' },
    { text: c('Contact field label').t`Organization`, value: 'org' },
    // translator: this field is used to specify the birth date of the contact
    { text: c('Contact field label').t`Birthday`, value: 'bday' },
    // translator: this field is used to specify the anniversary date of the contact (e.g. marriage, or equivalent)
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
    { text: c('Contact field label').t`Logo`, value: 'logo' },
];
export const getOtherInformationFields = () => [
    { text: c('Contact field label').t`Photo`, value: 'photo' },
    { text: c('Contact field label').t`Organization`, value: 'org' },
    // translator: this field is used to specify the birth date of the contact
    { text: c('Contact field label').t`Birthday`, value: 'bday' },
    // translator: this field is used to specify the anniversary date of the contact (e.g. marriage, or equivalent)
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
    { text: c('Contact field label').t`Logo`, value: 'logo' },
];

export const getAllFieldLabels = () => ({
    fn: c('Contact field label').t`Name`,
    email: c('Contact field label').t`Email`,
    tel: c('Contact field label').t`Phone`,
    adr: c('Contact field label').t`Address`,
    photo: c('Contact field label').t`Photo`,
    org: c('Contact field label').t`Organization`,
    // translator: this field is used to specify the birth date of the contact
    bday: c('Contact field label').t`Birthday`,
    // translator: this field is used to specify the anniversary date of the contact (e.g. marriage, or equivalent)
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
    categories: c('Contact field label').t`Categories`,
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
    // translator: Yomi name is a field for entering the phonetic equivalent for Japanese names
    yomi: c('Contact type label').t`Yomi`,
    other: c('Contact type label').t`Other`,
    fax: c('Contact type label').t`Fax`,
    // translator: https://en.wikipedia.org/wiki/Pager
    pager: c('Contact type label').t`Pager`,
});

export const getAllTypes: () => { [key: string]: { text: string; value: string }[] } = () => ({
    fn: [
        { text: c('Property type').t`Name`, value: '' },
        // translator: Yomi name is a field for entering the phonetic equivalent for Japanese names
        { text: c('Property type').t`Yomi`, value: 'yomi' },
    ],
    email: [
        { text: c('Property type').t`Email`, value: '' },
        { text: c('Property type').t`Home`, value: 'home' },
        { text: c('Property type').t`Work`, value: 'work' },
        { text: c('Property type').t`Other`, value: 'other' },
    ],
    tel: [
        { text: c('Property type').t`Phone`, value: '' },
        { text: c('Property type').t`Home`, value: 'home' },
        { text: c('Property type').t`Work`, value: 'work' },
        { text: c('Property type').t`Other`, value: 'other' },
        { text: c('Property type').t`Mobile`, value: 'cell' },
        { text: c('Property type').t`Main`, value: 'main' },
        { text: c('Property type').t`Fax`, value: 'fax' },
        { text: c('Property type').t`Pager`, value: 'pager' },
    ],
    adr: [
        { text: c('Property type').t`Address`, value: '' },
        { text: c('Property type').t`Home`, value: 'home' },
        { text: c('Property type').t`Work`, value: 'work' },
        { text: c('Property type').t`Other`, value: 'other' },
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
    member: [],
    note: [],
    url: [],
});

export const getTypeValues: () => { [key: string]: string[] } = () => ({
    fn: ['', 'yomi'],
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
    member: [],
    note: [],
    url: [],
});

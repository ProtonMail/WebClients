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
    // translator: this field is used to specify the birth date of the contact
    { text: c('Contact field label').t`Birthday`, value: 'bday' },
    // translator: this field is used to specify the anniversary date of the contact (e.g. marriage, or equivalent)
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
    { text: c('Contact field label').t`Sound`, value: 'sound' },
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
    n: c('Contact field label').t`Compact name`,
    nickname: c('Contact field label').t`Nickname`,
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
    impp: c('Contact field label').t`IMPP`,
    related: c('Contact field label').t`Related`,
    categories: c('Contact field label').t`Categories`,
    sound: c('Contact field label').t`Sound`,
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

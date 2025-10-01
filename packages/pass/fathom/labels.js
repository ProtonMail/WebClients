var FormType;

(function (FormType) {
    FormType['LOGIN'] = 'login';
    FormType['NOOP'] = 'noop';
    FormType['PASSWORD_CHANGE'] = 'password-change';
    FormType['RECOVERY'] = 'recovery';
    FormType['REGISTER'] = 'register';
})(FormType || (FormType = {}));

var FieldType;

(function (FieldType) {
    FieldType['EMAIL'] = 'email';
    FieldType['IDENTITY'] = 'identity';
    FieldType['OTP'] = 'otp';
    FieldType['PASSWORD_CURRENT'] = 'password';
    FieldType['PASSWORD_NEW'] = 'new-password';
    FieldType['USERNAME'] = 'username';
    FieldType['USERNAME_HIDDEN'] = 'username-hidden';
    FieldType['CREDIT_CARD'] = 'cc';
})(FieldType || (FieldType = {}));

var IdentityFieldType;

(function (IdentityFieldType) {
    IdentityFieldType[(IdentityFieldType['FULLNAME'] = 1)] = 'FULLNAME';
    IdentityFieldType[(IdentityFieldType['FIRSTNAME'] = 2)] = 'FIRSTNAME';
    IdentityFieldType[(IdentityFieldType['MIDDLENAME'] = 3)] = 'MIDDLENAME';
    IdentityFieldType[(IdentityFieldType['LASTNAME'] = 4)] = 'LASTNAME';
    IdentityFieldType[(IdentityFieldType['TELEPHONE'] = 5)] = 'TELEPHONE';
    IdentityFieldType[(IdentityFieldType['ADDRESS'] = 6)] = 'ADDRESS';
    IdentityFieldType[(IdentityFieldType['STATE'] = 7)] = 'STATE';
    IdentityFieldType[(IdentityFieldType['CITY'] = 8)] = 'CITY';
    IdentityFieldType[(IdentityFieldType['ZIPCODE'] = 9)] = 'ZIPCODE';
    IdentityFieldType[(IdentityFieldType['ORGANIZATION'] = 10)] = 'ORGANIZATION';
    IdentityFieldType[(IdentityFieldType['COUNTRY'] = 11)] = 'COUNTRY';
    IdentityFieldType[(IdentityFieldType['EMAIL'] = 12)] = 'EMAIL';
})(IdentityFieldType || (IdentityFieldType = {}));

var CCFieldType;

(function (CCFieldType) {
    CCFieldType[(CCFieldType['NAME'] = 1)] = 'NAME';
    CCFieldType[(CCFieldType['FIRSTNAME'] = 2)] = 'FIRSTNAME';
    CCFieldType[(CCFieldType['LASTNAME'] = 3)] = 'LASTNAME';
    CCFieldType[(CCFieldType['NUMBER'] = 4)] = 'NUMBER';
    CCFieldType[(CCFieldType['CSC'] = 5)] = 'CSC';
    CCFieldType[(CCFieldType['EXP'] = 6)] = 'EXP';
    CCFieldType[(CCFieldType['EXP_YEAR'] = 7)] = 'EXP_YEAR';
    CCFieldType[(CCFieldType['EXP_MONTH'] = 8)] = 'EXP_MONTH';
})(CCFieldType || (CCFieldType = {}));

const formTypes = Object.values(FormType);

const fieldTypes = Object.values(FieldType);

export { CCFieldType, FieldType, FormType, IdentityFieldType, fieldTypes, formTypes };

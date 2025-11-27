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
    IdentityFieldType['FULLNAME'] = 'id:fullname';
    IdentityFieldType['FIRSTNAME'] = 'id:firstname';
    IdentityFieldType['MIDDLENAME'] = 'id:middlname';
    IdentityFieldType['LASTNAME'] = 'id:lastname';
    IdentityFieldType['TELEPHONE'] = 'id:tel';
    IdentityFieldType['ADDRESS'] = 'id:address';
    IdentityFieldType['STATE'] = 'id:state';
    IdentityFieldType['CITY'] = 'id:city';
    IdentityFieldType['ZIPCODE'] = 'id:zipcode';
    IdentityFieldType['ORGANIZATION'] = 'id:org';
    IdentityFieldType['COUNTRY'] = 'id:country';
    IdentityFieldType['EMAIL'] = 'id:email';
})(IdentityFieldType || (IdentityFieldType = {}));

var CCFieldType;

(function (CCFieldType) {
    CCFieldType['NAME'] = 'cc:name';
    CCFieldType['FIRSTNAME'] = 'cc:firstname';
    CCFieldType['LASTNAME'] = 'cc:lastname';
    CCFieldType['NUMBER'] = 'cc:number';
    CCFieldType['CSC'] = 'cc:cvc';
    CCFieldType['EXP'] = 'cc:exp';
    CCFieldType['EXP_YEAR'] = 'cc:exp-year';
    CCFieldType['EXP_MONTH'] = 'cc:exp-month';
})(CCFieldType || (CCFieldType = {}));

const formTypes = Object.values(FormType);

const fieldTypes = Object.values(FieldType);

const identityFields = new Set(Object.values(IdentityFieldType));

const ccFields = new Set(Object.values(CCFieldType));

export { CCFieldType, FieldType, FormType, IdentityFieldType, ccFields, fieldTypes, formTypes, identityFields };

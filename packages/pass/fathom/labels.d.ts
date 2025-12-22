declare enum FormType {
    LOGIN = 'login',
    NOOP = 'noop',
    PASSWORD_CHANGE = 'password-change',
    RECOVERY = 'recovery',
    REGISTER = 'register',
}
declare enum FieldType {
    EMAIL = 'email',
    IDENTITY = 'identity',
    OTP = 'otp',
    PASSWORD_CURRENT = 'password',
    PASSWORD_NEW = 'new-password',
    USERNAME = 'username',
    USERNAME_HIDDEN = 'username-hidden',
    CREDIT_CARD = 'cc',
}
declare enum IdentityFieldType {
    FULLNAME = 'id:fullname',
    FIRSTNAME = 'id:firstname',
    MIDDLENAME = 'id:middlname',
    LASTNAME = 'id:lastname',
    TELEPHONE = 'id:tel',
    ADDRESS = 'id:address',
    STATE = 'id:state',
    CITY = 'id:city',
    ZIPCODE = 'id:zipcode',
    ORGANIZATION = 'id:org',
    COUNTRY = 'id:country',
    EMAIL = 'id:email',
}
declare enum CCFieldType {
    NAME = 'cc:name',
    FIRSTNAME = 'cc:firstname',
    LASTNAME = 'cc:lastname',
    NUMBER = 'cc:number',
    CSC = 'cc:cvc',
    EXP = 'cc:exp',
    EXP_YEAR = 'cc:exp-year',
    EXP_MONTH = 'cc:exp-month',
}
declare const formTypes: FormType[];
declare const fieldTypes: FieldType[];
declare const identityFields: Set<string>;
declare const ccFields: Set<string>;

export { CCFieldType, FieldType, FormType, IdentityFieldType, ccFields, fieldTypes, formTypes, identityFields };

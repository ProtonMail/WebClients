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
    FULLNAME = 1,
    FIRSTNAME = 2,
    MIDDLENAME = 3,
    LASTNAME = 4,
    TELEPHONE = 5,
    ADDRESS = 6,
    STATE = 7,
    CITY = 8,
    ZIPCODE = 9,
    ORGANIZATION = 10,
    COUNTRY = 11,
    EMAIL = 12,
}
declare enum CCFieldType {
    NAME = 1,
    FIRSTNAME = 2,
    LASTNAME = 3,
    NUMBER = 4,
    CSC = 5,
    EXP = 6,
    EXP_YEAR = 7,
    EXP_MONTH = 8,
}
declare const formTypes: FormType[];
declare const fieldTypes: FieldType[];

export { CCFieldType, FieldType, FormType, IdentityFieldType, fieldTypes, formTypes };

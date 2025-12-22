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

Object.values(FormType);

Object.values(FieldType);

export { FieldType, FormType };

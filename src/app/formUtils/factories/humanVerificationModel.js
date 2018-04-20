/* @ngInject */
function humanVerificationModel(dispatchers, signupModel, User) {
    const { dispatcher } = dispatchers(['humanVerification']);
    /**
     * Helper to build Destination object config,
     * - method: email => Address
     * - method: sms => Phone
     * @param  {String} method
     * @param  {String} value
     * @return {Object}
     */
    const getDestination = (method, value) => {
        const key = method === 'sms' ? 'Phone' : 'Address';
        return { [key]: value };
    };

    /**
     * Send verification code for sms / email
     * @param  {String} method 'sms' or 'email'
     * @param  {String} value email value or phone number
     * @return {Promise}
     */
    const sendCode = (method, value) => {
        return User.code({
            Username: signupModel.get('username'),
            Type: method,
            Destination: getDestination(method, value)
        })
            .then(() => {
                signupModel.set('smsVerificationSent', method === 'sms');
                signupModel.set('emailVerificationSent', method === 'email');
                dispatcher.humanVerification('code.sent.success', { method });
            })
            .catch(({ data = {} } = {}) =>
                dispatcher.humanVerification('code.sent.error', {
                    method,
                    errorMessage: data.Error
                })
            );
    };

    return { sendCode };
}

export default humanVerificationModel;

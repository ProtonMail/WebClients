angular.module('proton.models.reset', ['proton.srp'])

.factory('Reset', ($http, url, srp) => {
    return {
        // POST
        requestResetToken(params = {}) {
            return $http.post(url.get() + '/reset', params);
        },
        resetPassword(params = {}, newPassword = '') {
            const request = (data) => {
                const requestUrl = `${url.get()}/reset/${encodeURIComponent(data.Token)}`;
                return $http.post(requestUrl, data);
            };
            return srp
                .getPasswordParams(newPassword, params)
                .then(request);
        },
        getMailboxResetToken(params = {}) {
            return $http.post(url.get() + '/reset/mailbox', params);
        },
        resetMailbox(params = {}) {
            return $http.post(url.get() + '/reset/mailbox/' + encodeURIComponent(params.Token), params);
        },
        // GET
        validateResetToken(params = {}) {
            return $http.get(url.get() + '/reset/' + params.Username + '/' + encodeURIComponent(params.Token));
        }
    };
});

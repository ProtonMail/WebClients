angular.module('proton.vpn')
.factory('vpnApi', ($http, url) => {
    const getUrl = url.build('vpn');

    return {
        get() {
            return $http.get(getUrl());
        },
        auth(params) {
            return $http.post(getUrl('auth'), params);
        },
        accounting(params) {
            return $http.post(getUrl('accounting'), params);
        }
    };
});

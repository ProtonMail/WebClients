angular.module("proton.controllers.Upgrade", [])

.controller("UpgradeController", function($scope) {

    $scope.prngCompatible = function() {
      	if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        	return true;
      	} else if (typeof window !== 'undefined' && typeof window.msCrypto === 'object' && typeof window.msCrypto.getRandomValues === 'function') {
        	return true;
      	} else {
      		return false;
      	}
    };

    $scope.sessionStorageCompatible = function() {
        return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
    };
});

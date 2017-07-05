angular.module('proton.message', ['ngSanitize'])
    .run((unsubscribeModel) => unsubscribeModel.init());

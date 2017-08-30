angular.module('proton.analytics', [])
    .run((analytics, eventListener) => {
        analytics.init();
        eventListener.init();
    });

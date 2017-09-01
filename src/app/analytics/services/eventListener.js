angular.module('proton.analytics')
    .factory('eventListener', (CONSTANTS, CONFIG, $rootScope, analytics, pageTitlesModel) => {

        const TRACKED_STATES = ['signup', 'secured.dashboard', 'login', 'secured.inbox'];

        const state = { lastLocation: document.referrer };

        function generateTitle(state) {
            return document.domain + '/' + pageTitlesModel.find(state, false);
        }

        $rootScope.$on('$stateChangeSuccess', (event, toState) => {

            const referrer = state.lastLocation;
            state.lastLocation = location.href;

            if (!TRACKED_STATES.includes(toState.name)) {
                // don't track all urls, for instance, we don't want to trace someone accessing mails etcetera
                // also saves us from processing useless data
                return;
            }

            const title = generateTitle(toState);

            const page = { title, referrer, url: location.href };

            analytics.trackPage(page);

        });

        $rootScope.$on('signup', (event, { type, data }) => {
            if (type === 'user.subscription.finished') {
                const plan = data.plan || { Name: 'free' };

                const goals = [CONSTANTS.METRIC_GOALS.SIGNUP_ALL];

                if (plan.Name === 'free') {
                    goals.push(CONSTANTS.METRIC_GOALS.SIGNUP_FREE);
                } else {
                    goals.push(CONSTANTS.METRIC_GOALS.SIGNUP_PAID);
                }

                if (plan.Name === 'plus') {
                    goals.push(CONSTANTS.METRIC_GOALS.SIGNUP_PLUS);
                }

                if (plan.Name === 'visionary') {
                    goals.push(CONSTANTS.METRIC_GOALS.SIGNUP_VISIONARY);
                }

                analytics.trackGoals(goals);
            }
        });


        return { init: angular.noop };
    });

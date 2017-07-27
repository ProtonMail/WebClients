angular.module('proton.dashboard')
    .factory('customProPlanModel', ($rootScope, CONSTANTS, dashboardModel) => {
        const MAX_MEMBER = 50;
        const { MEMBER } = CONSTANTS.PLANS.ADDON;
        const { PROFESSIONAL } = CONSTANTS.PLANS.PLAN;
        const BASE = CONSTANTS.BASE_SIZE;
        const fromBase = (value) => (value / (BASE * BASE * BASE));
        const CACHE = {};
        const refreshSlider = (type) => $rootScope.$emit('refresh.slider', { type, data: { value: CACHE[type] } });
        const send = () => {
            const { plan } = dashboardModel.get(dashboardModel.cycle());
            const professionalPlan = plan[PROFESSIONAL];

            $rootScope.$emit('dashboard', { type: 'change.addon', data: { plan: 'professional', addon: 'member', value: CACHE.members - professionalPlan.MaxMembers } });
        };

        function getSliders() {
            return _.reduce(['members', 'storage', 'addresses'], (acc, type) => {
                acc[type] = getSliderParameters(type);
                return acc;
            }, {});
        }

        function getSliderParameters(type) {
            const { plan, addons } = dashboardModel.get(dashboardModel.cycle());
            const professionalPlan = plan[PROFESSIONAL];
            const memberAddon = addons[MEMBER];
            const { professional } = dashboardModel.config();

            let step;
            let start;
            let min;
            let max;

            switch (type) {
                case 'members':
                    step = memberAddon.MaxMembers;
                    start = ~~professional.member + professionalPlan.MaxMembers;
                    min = professionalPlan.MaxMembers;
                    max = MAX_MEMBER;
                    break;
                case 'storage':
                    step = fromBase(memberAddon.MaxSpace);
                    start = (~~professional.member + professionalPlan.MaxMembers) * step;
                    min = fromBase(professionalPlan.MaxSpace);
                    max = MAX_MEMBER * step;
                    break;
                case 'addresses':
                    step = memberAddon.MaxAddresses;
                    start = (~~professional.member + professionalPlan.MaxMembers) * step;
                    min = professionalPlan.MaxAddresses;
                    max = MAX_MEMBER * step;
                    break;
            }

            return {
                value: start,
                options: {
                    type,
                    animate: false,
                    tooltips: true,
                    connect: [true, false],
                    start,
                    step,
                    range: { min, max },
                    pips: {
                        mode: 'values',
                        values: [min, max],
                        density: 4
                    },
                    format: {
                        to(value) {
                            return `${Number(value).toFixed()}`;
                        },
                        from(value) {
                            return value;
                        }
                    }
                }
            };
        }

        $rootScope.$on('slider.updated', (event, { type, data = {} }) => {
            const { addons } = dashboardModel.get(dashboardModel.cycle());
            const memberAddon = addons[MEMBER];

            switch (type) {
                case 'members':
                    CACHE.members = data.value;
                    CACHE.storage = (data.value * fromBase(memberAddon.MaxSpace)) / memberAddon.MaxMembers;
                    CACHE.addresses = (data.value * memberAddon.MaxAddresses) / memberAddon.MaxMembers;

                    refreshSlider('storage');
                    refreshSlider('addresses');
                    break;
                case 'storage':
                    CACHE.storage = data.value;
                    CACHE.members = (data.value * memberAddon.MaxMembers) / fromBase(memberAddon.MaxSpace);
                    CACHE.addresses = (data.value * memberAddon.MaxAddresses) / fromBase(memberAddon.MaxSpace);

                    refreshSlider('members');
                    refreshSlider('addresses');
                    break;
                case 'addresses':
                    CACHE.addresses = data.value;
                    CACHE.storage = (data.value * fromBase(memberAddon.MaxSpace)) / memberAddon.MaxAddresses;
                    CACHE.members = (data.value * memberAddon.MaxMembers) / memberAddon.MaxAddresses;

                    refreshSlider('storage');
                    refreshSlider('members');
                    break;
                default:
                    break;
            }
        });

        return { init: angular.noop, getSliders, send };
    });

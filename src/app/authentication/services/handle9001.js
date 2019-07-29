/* @ngInject */
function handle9001($http, humanVerificationModal) {
    return (config, { Details = {} }) => {
        const { VerifyMethods: methods = [], Token: token } = Details;
        const useParams = ['GET', 'DELETE'].includes(config.method);
        return new Promise((resolve) => {
            humanVerificationModal.activate({
                params: {
                    methods,
                    token,
                    close(parameters = false) {
                        humanVerificationModal.deactivate();

                        if (parameters) {
                            return resolve(
                                $http({
                                    ...config,
                                    [useParams ? 'params' : 'data']: {
                                        ...(config[useParams ? 'params' : 'data'] || {}),
                                        ...parameters
                                    }
                                })
                            );
                        }
                        return resolve();
                    }
                }
            });
        });
    };
}
export default handle9001;

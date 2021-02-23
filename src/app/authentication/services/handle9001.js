/* @ngInject */
function handle9001($http, humanVerificationModal) {
    return (config, { Details = {} }) => {
        const { HumanVerificationMethods: methods = [], HumanVerificationToken: token } = Details;
        const useParams = ['GET', 'DELETE'].includes(config.method);
        return new Promise((resolve, reject) => {
            humanVerificationModal.activate({
                params: {
                    methods,
                    token,
                    close(parameters = false) {
                        humanVerificationModal.deactivate();

                        if (!parameters) {
                            return reject({});
                        }

                        return resolve(
                            $http({
                                ...config,
                                headers: {
                                    ...config.headers,
                                    'X-PM-Human-Verification-Token': parameters.Token,
                                    'X-PM-Human-Verification-Token-Type': parameters.TokenType
                                },
                                [useParams ? 'params' : 'data']: {
                                    ...(config[useParams ? 'params' : 'data'] || {})
                                }
                            })
                        );
                    }
                }
            });
        });
    };
}
export default handle9001;

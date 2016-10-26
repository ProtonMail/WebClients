angular.module('proton.bugReport')
.factory('Bug', ($http, $q, url) => {
    return {
        crash(data) {
            return $http.post(url.get() + '/bugs/crash', data);
        },
        report(data) {
            return $http.post(url.get() + '/bugs', data)
                .then(({ data = {} } = {}) => {
                    // Format the error
                    if (data.Error) {
                        let error = data.Error;
                        if (angular.isString(data.Error)) {
                            error = new Error(data.Error);
                        }
                        error.code = data.Code;
                        throw error;
                    }
                    return data;
                })
                .catch((err) => {
                    err.originalMessage = err.message;
                    err.message = 'Error during the sending request';
                    return Promise.reject(err);
                });
        },
        uploadScreenshot(image, form) {
            const deferred = $q.defer();

            /*
                We should use $http, but before we need to fix the interceptor
                to remove some headers before uploading an image to imgur.
             */
            $.ajax({
                url: 'https://api.imgur.com/3/image',
                headers: {
                    Authorization: 'Client-ID 864920c2f37d63f'
                },
                type: 'POST',
                data: { image },
                dataType: 'json',
                success({ data = {} } = {}) {
                    if (data.link) {
                        deferred.resolve(angular.extend({}, form, {
                            Description: `${form.Description}\n\n\n\n${data.link}`
                        }));
                    } else {
                        deferred.reject();
                    }
                },
                error() {
                    deferred.reject();
                }
            });

            return deferred.promise;
        }
    };
});

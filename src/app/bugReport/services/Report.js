import _ from 'lodash';

/* @ngInject */
function Report($http, url, gettextCatalog) {
    const requestURL = url.build('reports');
    const ERROR_REPORT = gettextCatalog.getString('Error communicating with the server', null, 'Report bug request');

    const crash = (data) => $http.post(requestURL('crash'), data);
    const bug = (data) => {
        return $http.post(requestURL('bug'), data).then(({ data = {} } = {}) => {
            if (data.Code === 1000) {
                return data;
            }
            throw new Error(data.Error || ERROR_REPORT);
        });
    };

    const uploadScreenshot = (image, form) =>
        new Promise((resolve, reject) => {
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
                        return resolve(
                            _.extend({}, form, {
                                Description: `${form.Description}\n\n\n\n${data.link}`
                            })
                        );
                    }
                    reject();
                },
                error: reject
            });
        });

    return { crash, bug, uploadScreenshot };
}
export default Report;

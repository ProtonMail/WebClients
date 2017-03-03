angular.module('proton.utils')
    .filter('labels', (authentication, $rootScope, labelsModel) => {
        return (labels = []) => {
            return labels.reduce((acc, id) => {
                const item = labelsModel.read(id, 'labels');
                item && acc.push(item);
                return acc;
            }, []);
        };
    });

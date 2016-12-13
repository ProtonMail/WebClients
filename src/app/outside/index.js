angular.module('proton.outside', ['proton.routes', 'proton.constants', 'proton.utils'])
    .run((attachmentModelOutside) => attachmentModelOutside.load());

angular.module('proton.outside', ['proton.routes', 'proton.constants', 'proton.storage'])
    .run((attachmentModelOutside) => attachmentModelOutside.load());

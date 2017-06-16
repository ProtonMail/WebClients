angular.module('proton.dnd')
    .constant('PTDNDCONSTANTS', {
        CLASSNAME: {
            BODY: 'ptdnd-dragstart',
            DRAG_HOVER: 'ptdnd-drag-hover',
            DROPZONE: 'ptDnd-dropzone-container',
            DROPZONE_HOVER: 'ptdnd-dropzone-hover',
            NOTIF: 'ptdnd-notification',
            NOTIF_ACTIVE: 'ptdnd-notification-active',
            NOTIF_FIREFOX: 'ptdnd-notification-firefox',
            DRAG_IMAGE: 'ptdnd-dragimage'
        },
        DROPZONE_ATTR_ID: 'data-pt-drop-id'
    });

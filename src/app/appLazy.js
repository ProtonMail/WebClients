import address from './address/index';
import attachments from './attachments/index';
import autoresponder from './autoresponder/index';
import composer from './composer/index';
import conversation from './conversation/index';
import dashboard from './dashboard/index';
import dnd from './dnd/index';
import elements from './elements/index';
import filter from './filter/index';
import labels from './labels/index';
import message from './message/index';
import sidebar from './sidebar/index';
import squire from './squire/index';
import vpn from './vpn/index';
import wizard from './wizard/index';
import blackFriday from './blackFriday/index';
import contact from './contact/index';
import command from './command/index';

export default angular.module('protonLazy', [
    'as.sortable',
    'ngIcal',
    'ngScrollbars',
    'pikaday',
    'ui.indeterminate',
    filter,
    squire,
    contact,
    command,
    wizard,
    blackFriday,
    dashboard,
    vpn,
    dnd,
    sidebar,
    elements,
    autoresponder,
    address,
    composer,
    attachments,
    message,
    conversation,
    labels
]);

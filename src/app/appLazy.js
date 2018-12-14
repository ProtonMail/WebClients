import invoices from './invoices/index';
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
import bridge from './bridge/index';
import pmMe from './pmMe/index';
import search from './search/index';
import security from './security/index';

export default angular.module('protonLazy', [
    'as.sortable',
    'ngScrollbars',
    'pikaday',
    'ui.indeterminate',
    invoices,
    security,
    filter,
    squire,
    search,
    contact,
    bridge,
    pmMe,
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

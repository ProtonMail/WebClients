import address from './address/index';
import attachments from './attachments/index';
import composer from './composer/index';
import conversation from './conversation/index';
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
import search from './search/index';

export default angular.module('protonLazy', [
    'pikaday',
    'ui.indeterminate',
    filter,
    squire,
    search,
    contact,
    command,
    wizard,
    blackFriday,
    vpn,
    dnd,
    sidebar,
    elements,
    address,
    composer,
    attachments,
    message,
    conversation,
    labels
]);

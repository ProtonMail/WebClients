import { c } from 'ttag';

export const getMailRouteTitles = () => ({
    desktop: c('Title').t`Get the apps`,
    general: c('Title').t`Messages and composing`,
    privacy: c('Title').t`Email privacy`,
    identity: c('Title').t`Identity and addresses`,
    folder: c('Title').t`Folders and labels`,
    filter: c('Title').t`Filters`,
    autoReply: c('Title').t`Forward and auto-reply`,
    domainNames: c('Title').t`Domain names`,
    keys: c('Title').t`Encryption and keys`,
    imap: c('Title').t`IMAP/SMTP`,
    backup: c('Title').t`Backup and export`,
});

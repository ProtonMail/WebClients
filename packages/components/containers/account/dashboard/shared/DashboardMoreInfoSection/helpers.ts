import { c } from 'ttag';

export function getDownloadAppText(app: string) {
    return c('Title').t`Download ${app}`;
}

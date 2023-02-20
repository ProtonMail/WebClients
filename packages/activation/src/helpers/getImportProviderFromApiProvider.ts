import { ApiImportProvider } from '../api/api.interface';
import { ImportProvider } from '../interface';

export const getImportProviderFromApiProvider = (provider: ApiImportProvider) => {
    switch (provider) {
        case ApiImportProvider.GOOGLE:
            return ImportProvider.GOOGLE;
        case ApiImportProvider.OUTLOOK:
            return ImportProvider.OUTLOOK;
        case ApiImportProvider.IMAP:
            return ImportProvider.DEFAULT;
        default:
            return ImportProvider.YAHOO;
    }
};

import { ImportType, ImporterActiveProps, NormalizedImporter } from '@proton/shared/lib/interfaces/EasySwitch';

import { ActiveImporter } from '../../../logic/importers/importers.interface';
import { ApiImportResponse } from '../../../logic/types/api.types';
import { AuthenticationMethod } from '../../../mail/interfaces';

export const getActiveImporterProgress = (activeImporter: ActiveImporter) => {
    const { product, mapping, total, processed } = activeImporter;
    if (product === ImportType.MAIL && mapping) {
        return mapping.reduce<{ total: number; processed: number }>(
            (acc, { Total = 0, Processed = 0 }) => {
                acc.total += Total;
                acc.processed += Processed;
                return acc;
            },
            { total: 0, processed: 0 }
        );
    }

    if (product === ImportType.CONTACTS) {
        return { total: total || 0, processed: processed || 0 };
    }

    return { total: 0, processed: 0 };
};

/**
 * @deprecated this method is there temporarilly for backward compatibility during Redux transition
 */
export const getDeprecatedImporterFormatByID = (apiImporter: ApiImportResponse): NormalizedImporter | undefined => {
    let importer: NormalizedImporter;

    const { ID, TokenID, Account, Provider, Product, ImapHost, ImapPort, Sasl, AllowSelfSigned, Active } =
        apiImporter.Importer;

    const commonValues = {
        ID,
        // Is defined when IMAP context
        TokenID: TokenID as string,
        Account,
        Provider,
        // Is defined when IMAP context
        ImapHost: ImapHost as string,
        // Is defined when IMAP context
        ImapPort: ImapPort as string,
        Sasl: Sasl as AuthenticationMethod,
        // Is defined when IMAP context
        AllowSelfSigned: AllowSelfSigned as boolean,
        tokenScope: Product,
        Email: Account,
    };

    if (Active?.Mail) {
        importer = {
            ...commonValues,
            Active: Active.Mail as unknown as ImporterActiveProps,
            Product: ImportType.MAIL,
        };
        return importer;
    }
    if (Active?.Calendar) {
        importer = {
            ...commonValues,
            Active: Active.Calendar as unknown as ImporterActiveProps,
            Product: ImportType.CALENDAR,
        };
        return importer;
    }
    if (Active?.Contacts) {
        importer = {
            ...commonValues,
            Active: Active.Contacts as unknown as ImporterActiveProps,
            Product: ImportType.CONTACTS,
        };
        return importer;
    }

    return undefined;
};

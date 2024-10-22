import { type ExtractIBANResult, extractIBAN as ibantoolsExtractIBAN } from 'ibantools';

// non-EU countries require Address Line 1
// https://docs.stripe.com/sources/sepa-debit#custom-client-side-source-creation
const ibanCountriesThatRequireAddress = new Set([
    'AD',
    'PF',
    'TF',
    'GI',
    'GB',
    'GG',
    'VA',
    'IM',
    'JE',
    'MC',
    'NC',
    'BL',
    'PM',
    'SM',
    'CH',
    'WF',
]);

function checkIfIbanCountryRequiresAddress(ibanCountryCode: string | undefined): boolean {
    return !!ibanCountryCode && ibanCountriesThatRequireAddress.has(ibanCountryCode);
}

type ExtendedExtractIBANResult = ExtractIBANResult & {
    requiresAddress: boolean;
};

export function extractIBAN(iban: string): ExtendedExtractIBANResult {
    const result = ibantoolsExtractIBAN(iban);
    return {
        ...result,
        requiresAddress: checkIfIbanCountryRequiresAddress(result.countryCode),
    };
}

//TODO: Remove this function after we authorize invite external
export const endsWithProtonInternalDomain = (email: string) => {
    // Regular expression to match the end of the email with the specified domains
    const protonDomainsRegex = /@([a-zA-Z0-9.-]+\.)?(proton\.ch|proton\.black|proton\.pink)$/;

    return protonDomainsRegex.test(email);
};

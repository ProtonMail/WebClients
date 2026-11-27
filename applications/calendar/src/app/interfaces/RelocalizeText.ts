export type RelocalizeText = ({
    getLocalizedText,
    newLocaleCode,
    relocalizeDateFormat,
}: {
    getLocalizedText: () => string;
    newLocaleCode?: string;
    relocalizeDateFormat?: boolean;
}) => Promise<string>;

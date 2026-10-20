/** Translatable strings must not contain brand names, which have to stay untranslated constants. */
export const brandNameSelectors = [
    {
        selector:
            'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\bProton\\b(?!\\s+(Account|Mail|Drive|Calendar|VPN|Verify|Sentinel))/i]',
        message: 'Use `BRAND_NAME` instead to avoid possible translation.',
    },
    {
        selector:
            'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\bProton Account\\b/i]',
        message: 'Use `${BRAND_NAME} Account` instead to allow translation of `Account`.',
    },
    {
        selector: 'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\bProton Mail\\b/i]',
        message: 'Use `MAIL_APP_NAME` instead to avoid possible translation.',
    },
    {
        selector:
            'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\bProton Drive\\b/i]',
        message: 'Use `DRIVE_APP_NAME` instead to avoid possible translation.',
    },
    {
        selector:
            'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\bProton Calendar\\b/i]',
        message: 'Use `CALENDAR_APP_NAME` instead to avoid possible translation.',
    },
    {
        selector: 'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\bProton VPN\\b/i]',
        message: 'Use `VPN_APP_NAME` instead to avoid possible translation.',
    },
    {
        selector:
            'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\bProton Verify\\b/i]',
        message: 'Use `VERIFY_APP_NAME` instead to avoid possible translation.',
    },
    {
        selector:
            'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\bDark Web Monitoring\\b/i]',
        message: 'Use `DARK_WEB_MONITORING_NAME` instead to avoid possible translation.',
    },
    {
        selector:
            'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\bProton Sentinel\\b/i]',
        message: 'Use `PROTON_SENTINEL_NAME` instead to avoid possible translation.',
    },
    {
        selector: 'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\bLumo\\b/i]',
        message: 'Use `LUMO_SHORT_APP_NAME` instead to avoid possible translation.',
    },
    {
        selector: 'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\biDEAL\\b/]',
        message: 'Use `IDEAL_BRAND_NAME` instead to avoid possible translation.',
    },
    {
        selector: 'TaggedTemplateExpression > TemplateLiteral > TemplateElement.quasis[value.raw=/\\bWero\\b/i]',
        message: 'Use `WERO_BRAND_NAME` instead to avoid possible translation.',
    },
];

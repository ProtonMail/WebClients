import type { API, FileInfo, ImportDeclaration, ImportSpecifier, Options } from 'jscodeshift';

const REPLACEMENTS: [string, string][] = [
    ['@proton/payments/ui/', '@proton/payments-ui/ui/'],
    ['@proton/payments/core/entitlements/hooks', '@proton/payments-ui/entitlements/hooks'],
    ['@proton/payments/core/payment-processors/useApplePay', '@proton/payments-ui/payment-processors/useApplePay'],
    ['@proton/payments/core/payment-processors/useGooglePay', '@proton/payments-ui/payment-processors/useGooglePay'],
    [
        '@proton/payments/core/payment-methods/useCurrencyOverride',
        '@proton/payments-ui/payment-methods/useCurrencyOverride',
    ],
    [
        '@proton/payments/telemetry/useSubscriptionModificationChangeStepTelemetry',
        '@proton/payments-ui/telemetry/useSubscriptionModificationChangeStepTelemetry',
    ],
];

const CURRENCY_OVERRIDE_SOURCE = '@proton/payments/core/payment-methods/useCurrencyOverride';
const CURRENCY_OVERRIDE_PURE_TARGET = '@proton/payments/core/payment-methods/currencyOverride';
const CURRENCY_OVERRIDE_UI_TARGET = '@proton/payments-ui/payment-methods/useCurrencyOverride';

const PURE_CURRENCY_OVERRIDE_IMPORTS = new Set([
    'getIsCurrencyOverriden',
    'getMethodSupportedCurrencies',
    'isCurrencyRestrictedMethod',
    'isCurrencySupportedByMethod',
    'updateCurrencyOverride',
]);

function getImportedName(specifier: ImportSpecifier): string {
    if (specifier.imported.type === 'Identifier') {
        return specifier.imported.name;
    }
    if ('value' in specifier.imported) {
        return String(specifier.imported.value);
    }
    return '';
}

function isPureCurrencyOverrideImport(specifier: NonNullable<ImportDeclaration['specifiers']>[number]): boolean {
    return specifier.type === 'ImportSpecifier' && PURE_CURRENCY_OVERRIDE_IMPORTS.has(getImportedName(specifier));
}

function transform(fileInfo: FileInfo, api: API, _options: Options) {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);

    let hasChanges = false;

    root.find(j.ImportDeclaration).forEach((path) => {
        const source = path.node.source.value;
        if (typeof source !== 'string') {
            return;
        }

        if (source === CURRENCY_OVERRIDE_SOURCE) {
            const specifiers = path.node.specifiers ?? [];
            const pureSpecifiers: NonNullable<ImportDeclaration['specifiers']> = [];
            const uiSpecifiers: NonNullable<ImportDeclaration['specifiers']> = [];

            for (const specifier of specifiers) {
                if (isPureCurrencyOverrideImport(specifier)) {
                    pureSpecifiers.push(specifier);
                } else {
                    uiSpecifiers.push(specifier);
                }
            }

            if (pureSpecifiers.length > 0 && uiSpecifiers.length > 0) {
                path.node.specifiers = pureSpecifiers;
                path.node.source = j.literal(CURRENCY_OVERRIDE_PURE_TARGET);
                j(path).insertAfter(j.importDeclaration(uiSpecifiers, j.literal(CURRENCY_OVERRIDE_UI_TARGET)));
                hasChanges = true;
                return;
            }

            if (pureSpecifiers.length > 0) {
                path.node.specifiers = pureSpecifiers;
                path.node.source = j.literal(CURRENCY_OVERRIDE_PURE_TARGET);
                hasChanges = true;
                return;
            }

            // Hook-only, default, or namespace imports fall through to REPLACEMENTS.
        }

        for (const [from, to] of REPLACEMENTS) {
            if (source === from || source.startsWith(from)) {
                path.node.source = j.literal(source.replace(from, to));
                hasChanges = true;
                break;
            }
        }
    });

    if (!hasChanges) {
        return fileInfo.source;
    }

    return root.toSource({ quote: 'single' });
}

transform.parser = 'tsx';

export default transform;

import type {
    ContentModelFormatContainerFormat,
    ContentModelImageFormat,
    DomToModelOption,
    ElementProcessor,
    FormatApplier,
    FormatParser,
    ModelToDomOption,
} from 'roosterjs-content-model-types';

/**
 * Mail finds the signature, the quote and embedded images by these classes, but the Content Model only keeps
 * classes on links, and unwraps a div that has nothing but a class
 */
const PROTON_CLASS_PREFIX = 'protonmail_';
const EMBEDDED_IMAGE_CLASS = 'proton-embedded';

type ClassNameFormat = (ContentModelFormatContainerFormat | ContentModelImageFormat) & { protonClassName?: string };

const isProtonClass = (className: string) =>
    className.startsWith(PROTON_CLASS_PREFIX) || className === EMBEDDED_IMAGE_CLASS;

const hasProtonClass = (element: HTMLElement) => Array.from(element.classList).some(isProtonClass);

/**
 * A pasted signature or quote must not become a second one that mail would find first
 */
export const removeProtonClassNames = (fragment: DocumentFragment) => {
    fragment.querySelectorAll<HTMLElement>('[class]').forEach((element) => {
        element.classList.remove(...Array.from(element.classList).filter(isProtonClass));
    });
};

const getDivProcessor =
    (formatContainerProcessor: ElementProcessor<HTMLElement>): ElementProcessor<HTMLDivElement> =>
    (group, element, context) => {
        if (!hasProtonClass(element)) {
            context.defaultElementProcessors.div?.(group, element, context);
            return;
        }

        const skipFallback = context.skipFormatContainerFallbackCheck;
        context.skipFormatContainerFallbackCheck = true;
        formatContainerProcessor(group, element, context);
        context.skipFormatContainerFallbackCheck = skipFallback;
    };

const classNameParser: FormatParser<ClassNameFormat> = (format, element) => {
    if (hasProtonClass(element)) {
        format.protonClassName = element.className;
    }
};

const classNameApplier: FormatApplier<ClassNameFormat> = (format, element) => {
    if (format.protonClassName) {
        element.className = format.protonClassName;
    }
};

export const getProtonClassNamesDomToModelOption = (
    formatContainerProcessor: ElementProcessor<HTMLElement>
): DomToModelOption => ({
    processorOverride: { div: getDivProcessor(formatContainerProcessor) },
    additionalFormatParsers: { container: [classNameParser], image: [classNameParser] },
});

export const protonClassNamesModelToDomOption: ModelToDomOption = {
    additionalFormatAppliers: { container: [classNameApplier], image: [classNameApplier] },
};

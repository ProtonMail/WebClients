import isTruthy from '@proton/utils/isTruthy';

type V = string | boolean | null | undefined;

function isValidValue(a: any) {
    return (
        isTruthy(a) &&
        /**
         * whitespace is not valid
         */
        (typeof a === 'string' ? a.trim() !== '' : true)
    );
}

function clsx(args: V[]): string;
function clsx(...args: V[]): string;
function clsx(...args: any): any {
    return args
        .flat()
        .filter(isValidValue)
        .map((a: any) => a.toString().trim())
        .join(' ')
        .trim();
}

export default clsx;

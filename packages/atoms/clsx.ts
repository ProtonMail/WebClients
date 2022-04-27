import isTruthy from '@proton/shared/lib/helpers/isTruthy';

type V = string | boolean | null | undefined;

function clsx(args: V[]): string;
function clsx(...args: V[]): string;
function clsx(...args: any): any {
    return args.flat().filter(isTruthy).join(' ').trim();
}

export default clsx;

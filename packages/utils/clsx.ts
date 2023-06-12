type V = string | boolean | null | undefined;

function clsx(args: V[]): string;
function clsx(...args: V[]): string;
function clsx(...args: any): any {
    return args
        .flat()
        .filter((a: any) => typeof a === 'string')
        .map((a: string) => a.trim())
        .filter((a: string) => a !== '')
        .join(' ');
}

export default clsx;

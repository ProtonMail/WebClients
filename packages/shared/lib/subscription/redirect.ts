export const getRedirect = (redirect: string | null | undefined) => {
    return redirect && /^(\/$|\/[^/]|proton-?(vpn|mail|drive)?:\/\/)/.test(redirect) ? redirect : undefined;
};

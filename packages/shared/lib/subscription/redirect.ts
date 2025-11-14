export const getRedirect = (redirect: string | null | undefined) => {
    return redirect && /^proton-?(vpn|mail|drive|pass|lumo|meet|wallet)?:\/\//.test(redirect) ? redirect : undefined;
};

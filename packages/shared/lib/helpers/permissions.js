export const hasPermission = (userPermissions, pagePermissions = [], sectionPermissions = []) => {
    const requirements = pagePermissions.concat(sectionPermissions);

    if (!requirements.length) {
        return true;
    }

    return requirements.every((permission) => {
        return userPermissions.includes(permission);
    });
};

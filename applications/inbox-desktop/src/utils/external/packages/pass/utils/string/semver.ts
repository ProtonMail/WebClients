type SemVer = number;

const BASE = "000";

export const semver = (version: string): SemVer => {
    const [major = BASE, minor = BASE, patch = BASE, build = BASE] = version.split(/[.-]/).map((part) => {
        const value = parseInt(part.slice(0, BASE.length + 1), 10);
        return (isNaN(value) || value <= 0 ? 0 : value).toString().padStart(BASE.length, "0");
    });

    return parseInt(major + minor + patch + build, 10);
};

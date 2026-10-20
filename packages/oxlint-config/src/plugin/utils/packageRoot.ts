import fs from 'node:fs';
import path from 'node:path';

interface PackageManifest {
    name?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    bundledDependencies?: string[];
    bundleDependencies?: string[];
}

export interface PackageRoot {
    directory: string;
    manifest: PackageManifest;
}

const packageRootByDirectory = new Map<string, PackageRoot | null>();

/** Nearest directory holding a package.json, walking up from `directory`. */
export function findPackageRoot(directory: string): PackageRoot | null {
    const cached = packageRootByDirectory.get(directory);
    if (cached !== undefined) {
        return cached;
    }
    const manifestPath = path.join(directory, 'package.json');
    let packageRoot: PackageRoot | null;
    if (fs.existsSync(manifestPath)) {
        packageRoot = { directory, manifest: JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as PackageManifest };
    } else {
        const parent = path.dirname(directory);
        packageRoot = parent === directory ? null : findPackageRoot(parent);
    }
    packageRootByDirectory.set(directory, packageRoot);
    return packageRoot;
}

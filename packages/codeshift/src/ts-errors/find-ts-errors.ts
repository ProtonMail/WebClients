import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const WORKSPACE_ROOT = path.resolve(__dirname, '../../../../');
const PACKAGES_DIR = path.join(WORKSPACE_ROOT, 'packages');
const APPLICATIONS_DIR = path.join(WORKSPACE_ROOT, 'applications');
const CODESHIFT_DIR = path.join(WORKSPACE_ROOT, 'packages/codeshift');

// Command to run for each package with check-types script
const CHECK_TYPES_COMMAND = 'yarn check-types | grep -E "\\.(ts|tsx)" | sed -E \'s/\\([0-9]+,[0-9]+\\).*//\' | sort -u';

// Parse command line arguments
function parseArgs(): { outputFile?: string } {
    const args = process.argv.slice(2);
    const result: { outputFile?: string } = {};

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '-o' && i + 1 < args.length) {
            result.outputFile = args[i + 1];
            i++; // Skip the next argument as it's the filename
        }
    }

    return result;
}

/**
 * Find all package.json files in the given directory recursively
 */
function findPackageJsonFiles(dir: string): string[] {
    const files: string[] = [];

    if (!fs.existsSync(dir)) {
        return files;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);

        if (entry.isDirectory() && entry.name !== 'node_modules') {
            files.push(...findPackageJsonFiles(entryPath));
        } else if (entry.isFile() && entry.name === 'package.json') {
            files.push(entryPath);
        }
    }

    return files;
}

/**
 * Check if a package.json has check-types script
 */
function hasCheckTypesScript(packageJsonPath: string): boolean {
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        return packageJson.scripts && 'check-types' in packageJson.scripts;
    } catch (error) {
        console.error(`Error reading ${packageJsonPath}:`, error);
        return false;
    }
}

/**
 * Normalize a path to be relative to the workspace root
 * This converts paths like "../../packages/xyz" or "src/abc" to "packages/xyz" or "applications/account/src/abc"
 */
function normalizePathToWorkspaceRoot(filePath: string, packageDir: string): string {
    // Handle case when filePath is already absolute
    if (path.isAbsolute(filePath)) {
        return path.relative(CODESHIFT_DIR, filePath);
    }

    // Convert relative path to absolute path based on package directory
    const absolutePath = path.resolve(packageDir, filePath);

    // Convert absolute path to relative path from workspace root
    return path.relative(CODESHIFT_DIR, absolutePath);
}

/**
 * Process output to convert all paths to be relative to workspace root
 */
function processOutput(output: string, packageDir: string): string {
    if (!output.trim()) {
        return '';
    }

    return output
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => normalizePathToWorkspaceRoot(line.trim(), packageDir))
        .join('\n');
}

/**
 * Run the check-types command for a package
 */
function runCheckTypes(packageDir: string): string {
    try {
        const output = execSync(CHECK_TYPES_COMMAND, {
            cwd: packageDir,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        return processOutput(output, packageDir);
    } catch (error: any) {
        // The command might fail if there are type errors, but we still want the output
        if (error.stdout) {
            return processOutput(error.stdout, packageDir);
        }
        console.error(`Error running check-types for ${packageDir}:`, error);
        return '';
    }
}

/**
 * Output the results either to console or to a file
 */
function outputResults(content: string, outputFile?: string) {
    if (outputFile) {
        try {
            fs.writeFileSync(outputFile, content, 'utf8');
            console.log(`Results written to ${outputFile}`);
        } catch (error) {
            console.error(`Error writing to file ${outputFile}:`, error);
        }
    } else {
        console.log(content);
    }
}

/**
 * Main function
 */
async function main() {
    // Parse command line arguments
    const { outputFile } = parseArgs();

    // Find all package.json files in packages/ and applications/
    const packageJsonFiles = [...findPackageJsonFiles(PACKAGES_DIR), ...findPackageJsonFiles(APPLICATIONS_DIR)];

    console.log(`Found ${packageJsonFiles.length} package.json files`);

    // Filter to those with check-types script
    const packagesWithCheckTypes = packageJsonFiles.filter(hasCheckTypesScript);

    console.log(`Found ${packagesWithCheckTypes.length} packages with check-types script`);

    // Use a Set to store unique file paths
    const uniquePaths = new Set<string>();

    // Loop through packages with progress tracking
    packagesWithCheckTypes.forEach((packageJsonPath, index) => {
        const packageDir = path.dirname(packageJsonPath);
        const processed = index + 1;
        const total = packagesWithCheckTypes.length;
        const remaining = total - processed;

        console.log(`Running check-types for ${packageDir}... (${processed}/${total}, ${remaining} remaining)`);

        const result = runCheckTypes(packageDir);
        if (result) {
            // Add each path to the Set to ensure uniqueness
            result.split('\n').forEach((path) => {
                if (path.trim()) {
                    uniquePaths.add(path.trim());
                }
            });
        }
    });

    // Convert Set to sorted array and join with newlines
    const sortedUniquePaths = [...uniquePaths].sort();

    // Prepare output content
    const outputContent = sortedUniquePaths.join('\n');

    // Output combined results
    if (outputFile) {
        outputResults(outputContent, outputFile);
    } else {
        console.log(outputContent);
    }
}

// Run the main function
main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
});

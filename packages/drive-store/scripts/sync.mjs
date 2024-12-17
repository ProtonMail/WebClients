import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let logLevel = 'info';

// Function to copy files from source to target
async function copyFiles(source, target) {
    try {
        const sourceEntries = await fs.readdir(source, { withFileTypes: true });
        const targetEntries = await fs.readdir(target, { withFileTypes: true });

        try {
            await fs.access(target);
        } catch {
            console.log(`Target directory does not exist and will be skipped: ${target}`);
            return;
        }

        // Remove files/directories that exist in target but not in source
        for (let targetEntry of targetEntries) {
            const sourcePath = path.join(source, targetEntry.name);
            const targetPath = path.join(target, targetEntry.name);

            try {
                await fs.access(sourcePath);
            } catch {
                // Source doesn't exist, so remove from target
                if (targetEntry.isDirectory()) {
                    await fs.rm(targetPath, { recursive: true });
                } else {
                    await fs.unlink(targetPath);
                }
                console.log(`Removed stale ${targetEntry.isDirectory() ? 'directory' : 'file'}: ${targetPath}`);
            }
        }

        // Continue with existing copy logic
        for (let entry of sourceEntries) {
            const sourcePath = path.join(source, entry.name);
            const targetPath = path.join(target, entry.name);

            try {
                await fs.access(targetPath);
                if (entry.isDirectory()) {
                    await copyFiles(sourcePath, targetPath);
                } else if (entry.isFile()) {
                    await fs.copyFile(sourcePath, targetPath);
                    if (logLevel === 'debug') {
                        console.log(`Copied file from ${sourcePath} to ${targetPath}`);
                    }
                }
            } catch {
                console.log(`Skipping non-existent target: ${targetPath}`);
            }
        }
    } catch (error) {
        console.error(`Error accessing or copying files from ${source} to ${target}:`, error);
    }
}

// Function to parse both import and export statements from a file
async function parseImportsAndExports(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        const importExportRegex = /(import|export)\s+.*?['"](.*?\.\/.*?)['"]/g;
        let matches;
        const localPaths = [];

        // Capture both import and export paths
        while ((matches = importExportRegex.exec(content)) !== null) {
            localPaths.push(matches[2]); // Path is in the second capture group
        }

        return localPaths;
    } catch (error) {
        console.error(`Error reading file: ${filePath}`, error);
        return [];
    }
}

// Function to resolve the actual path of an imported or exported file by checking multiple extensions
async function resolveImportExportPath(importPath, currentDir) {
    const possibleExtensions = ['.ts', '.tsx', '/index.ts', '/index.tsx'];

    for (let ext of possibleExtensions) {
        const fullPath = path.resolve(currentDir, importPath + ext);
        try {
            await fs.access(fullPath); // Check if the file exists
            return fullPath; // Return the first valid file path
        } catch {
            // File does not exist with this extension, try next one
        }
    }

    return null; // Return null if no valid path is found
}

// Ensure target directory exists
async function ensureDirectoryExists(targetPath) {
    try {
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
    } catch (error) {
        console.error(`Error creating directory for path: ${targetPath}`, error);
    }
}

// Function to copy imported and exported files recursively
async function copyImportedExportedFiles(sourceFilePath, sourceDir, targetDir, visited = new Set(), importStack = []) {
    if (visited.has(sourceFilePath)) return;
    visited.add(sourceFilePath);

    // Check for circular imports
    if (importStack.includes(sourceFilePath)) {
        console.error(`Circular import detected: ${importStack.join(' -> ')} -> ${sourceFilePath}`);
        return;
    }

    importStack.push(sourceFilePath);

    const localPaths = await parseImportsAndExports(sourceFilePath);

    for (let relativeImportPath of localPaths) {
        const sourceImportPath = await resolveImportExportPath(relativeImportPath, path.dirname(sourceFilePath));

        if (!sourceImportPath) {
            console.error(`Failed to resolve imported/exported file for ${relativeImportPath} from ${sourceFilePath}`);
            continue;
        }

        const targetImportPath = path.resolve(targetDir, path.relative(sourceDir, sourceImportPath));

        try {
            await ensureDirectoryExists(targetImportPath); // Ensure the target directory exists
            await fs.copyFile(sourceImportPath, targetImportPath);
            if (logLevel === 'debug') {
                console.log(`Copied imported/exported file from ${sourceImportPath} to ${targetImportPath}`);
            }

            // Recursively handle the imported/exported file
            await copyImportedExportedFiles(sourceImportPath, sourceDir, targetDir, visited, importStack);
        } catch (error) {
            console.error(`Failed to copy imported/exported file: ${sourceImportPath}`, error);
        }
    }

    importStack.pop();
}

async function syncDirectories() {
    try {
        const configPath = path.join(__dirname, 'sync-config.json');
        const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
        const baseDir = path.resolve(config.base);
        const originalDir = path.resolve(config.original);
        logLevel = config.logLevel || 'info';

        for (let dir of config.directories) {
            const targetPath = path.join(baseDir, dir);
            const sourcePath = path.join(originalDir, dir);
            console.log(`Checking sync for ${sourcePath} to ${targetPath}`);
            await copyFiles(sourcePath, targetPath);

            // Now process .ts and .tsx files to copy over imports and exports
            const tsFiles = await fs.readdir(sourcePath);
            for (let file of tsFiles.filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'))) {
                const sourceFilePath = path.join(sourcePath, file);
                console.log(`Parsing and syncing imports/exports for ${sourceFilePath}`);
                await copyImportedExportedFiles(sourceFilePath, originalDir, baseDir);
            }
        }

        // Apply patches
        const patchDir = path.resolve(baseDir, 'patches');
        const entries = await fs.readdir(patchDir, { withFileTypes: true });

        for (let entry of entries) {
            if (!entry.isFile()) {
                continue;
            }

            try {
                const patchPath = path.resolve(patchDir, entry.name);

                console.log(`Applying patch: ${entry.name}`);
                execSync(`git apply ${patchPath}`);
            } catch (error) {
                console.error('Failed to apply patch:', error);
            }
        }
    } catch (error) {
        console.error('Failed to sync directories:', error);
    }
}

syncDirectories();

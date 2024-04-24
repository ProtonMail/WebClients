/**
 * A script that will sync any files that exist in packages/drive-store
 * with the original implementation in applications/drive
 */
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function copyFiles(source, target) {
    try {
        const entries = await fs.readdir(source, { withFileTypes: true });

        try {
            await fs.access(target);
        } catch {
            console.log(`Target directory does not exist and will be skipped: ${target}`);
            return;
        }

        for (let entry of entries) {
            const sourcePath = path.join(source, entry.name);
            const targetPath = path.join(target, entry.name);

            try {
                await fs.access(targetPath);
                if (entry.isDirectory()) {
                    await copyFiles(sourcePath, targetPath);
                } else if (entry.isFile()) {
                    await fs.copyFile(sourcePath, targetPath);
                    console.log(`Copied file from ${sourcePath} to ${targetPath}`);
                }
            } catch {
                console.log(`Skipping non-existent target: ${targetPath}`);
            }
        }
    } catch (error) {
        console.error(`Error accessing or copying files from ${source} to ${target}:`, error);
    }
}

async function syncDirectories() {
    try {
        const configPath = path.join(__dirname, 'sync-config.json');
        const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
        const baseDir = path.resolve(config.base);
        const originalDir = path.resolve(config.original);

        for (let dir of config.directories) {
            const targetPath = path.join(baseDir, dir);
            const sourcePath = path.join(originalDir, dir);
            console.log(`Checking sync for ${sourcePath} to ${targetPath}`);
            await copyFiles(sourcePath, targetPath);
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
            } catch (e) {
                console.error('Failed to apply patch:', error);
            }
        }
    } catch (error) {
        console.error('Failed to sync directories:', error);
    }
}

syncDirectories();

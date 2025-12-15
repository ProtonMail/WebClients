import { EMPTY_FOLDER_PLACEHOLDER_FILE } from '../constants';
import { buildFolderStructure } from './buildFolderStructure';

const createFileWithPath = (name: string, path: string) => {
    const file = new File([''], name);
    Object.defineProperty(file, 'webkitRelativePath', { value: path });
    return file;
};

const convertMapToObject = (node: any): any => {
    return {
        name: node.name,
        files: node.files,
        subfolders: Object.fromEntries(
            (Array.from(node.subfolders.entries()) as [string, any][]).map(([key, value]) => {
                return [key, convertMapToObject(value)];
            })
        ),
    };
};

describe('buildFolderStructure', () => {
    it('should create simple folder structure', () => {
        const file = createFileWithPath('document.txt', 'MyFolder/document.txt');
        const structure = buildFolderStructure([file]);

        expect(convertMapToObject(structure)).toMatchObject({
            name: 'MyFolder',
            files: [expect.any(File)],
            subfolders: {},
        });
    });

    it('should handle multiple files in root', () => {
        const files = [
            createFileWithPath('file1.txt', 'Root/file1.txt'),
            createFileWithPath('file2.txt', 'Root/file2.txt'),
        ];

        const structure = buildFolderStructure(files);

        expect(convertMapToObject(structure)).toMatchObject({
            name: 'Root',
            files: [expect.any(File), expect.any(File)],
            subfolders: {},
        });
    });

    it('should create nested folder structure', () => {
        const file = createFileWithPath('file.txt', 'Root/Level1/Level2/file.txt');
        const structure = buildFolderStructure([file]);

        expect(convertMapToObject(structure)).toMatchObject({
            name: 'Root',
            files: [],
            subfolders: {
                Level1: {
                    name: 'Level1',
                    files: [],
                    subfolders: {
                        Level2: {
                            name: 'Level2',
                            files: [expect.any(File)],
                            subfolders: {},
                        },
                    },
                },
            },
        });
    });

    it('should handle complex folder structures', () => {
        const files = [
            createFileWithPath('index.html', 'Project/index.html'),
            createFileWithPath('style.css', 'Project/css/style.css'),
            createFileWithPath('app.js', 'Project/js/app.js'),
            createFileWithPath('utils.js', 'Project/js/utils.js'),
        ];

        const structure = buildFolderStructure(files);

        expect(convertMapToObject(structure)).toMatchObject({
            name: 'Project',
            files: [expect.any(File)],
            subfolders: {
                css: {
                    name: 'css',
                    files: [expect.any(File)],
                    subfolders: {},
                },
                js: {
                    name: 'js',
                    files: [expect.any(File), expect.any(File)],
                    subfolders: {},
                },
            },
        });
    });

    it('should throw error for empty file array', () => {
        expect(() => buildFolderStructure([])).toThrow('No file to upload');
    });

    it('should filter ignored files and throw if none remain', () => {
        expect(() => buildFolderStructure([new File([''], '.DS_Store')])).toThrow('No file to upload');
    });

    it('should handle empty path segments', () => {
        const file = createFileWithPath('file.txt', 'Root//SubFolder///file.txt');
        const structure = buildFolderStructure([file]);

        expect(convertMapToObject(structure)).toMatchObject({
            name: 'Root',
            files: [],
            subfolders: {
                SubFolder: {
                    name: 'SubFolder',
                    files: [expect.any(File)],
                    subfolders: {},
                },
            },
        });
    });

    it('should handle empty folders with .keep placeholder files', () => {
        const keepFile = createFileWithPath(
            EMPTY_FOLDER_PLACEHOLDER_FILE,
            `EmptyFolder/${EMPTY_FOLDER_PLACEHOLDER_FILE}`
        );
        const structure = buildFolderStructure([keepFile]);

        expect(convertMapToObject(structure)).toMatchObject({
            name: 'EmptyFolder',
            files: [],
            subfolders: {},
        });
    });

    it('should handle nested empty folders with .keep files', () => {
        const keepFile1 = createFileWithPath(
            EMPTY_FOLDER_PLACEHOLDER_FILE,
            `ParentFolder/${EMPTY_FOLDER_PLACEHOLDER_FILE}`
        );
        const keepFile2 = createFileWithPath(
            EMPTY_FOLDER_PLACEHOLDER_FILE,
            `ParentFolder/EmptySubfolder/${EMPTY_FOLDER_PLACEHOLDER_FILE}`
        );
        const structure = buildFolderStructure([keepFile1, keepFile2]);

        expect(convertMapToObject(structure)).toMatchObject({
            name: 'ParentFolder',
            files: [],
            subfolders: {
                EmptySubfolder: {
                    name: 'EmptySubfolder',
                    files: [],
                    subfolders: {},
                },
            },
        });
    });
});

import { getImportFilename } from '@proton/pass/lib/import/helpers/files';
import { ImportProvider } from '@proton/pass/lib/import/types';

describe('`getImportFilename`', () => {
    test.each([
        ['/path/export.12345992838.csv', 'export.csv'],
        ['export.csv', 'export.csv'],
        ['/a/b/c/export.12345992838.csv', 'export.csv'],
        ['/path/12345992838.csv', '12345992838.csv'],
        ['12345992838.csv', '12345992838.csv'],
        ['/a/b/c/12345992838.csv', '12345992838.csv'],
        ['/a/a.b.12345992838.csv', 'a.b.csv'],
        ['/path/exportfile', 'exportfile'],
        ['/path/exportfile.unknown', 'exportfile.unknown'],
    ])('handles PROTONPASS provider with path %s', (inputPath, expectedResult) => {
        expect(getImportFilename(inputPath, ImportProvider.PROTONPASS)).toBe(expectedResult);
    });

    test.each([
        ['/path/123__filename.csv', 'filename.csv'],
        ['/path/123__file__name.csv', 'file__name.csv'],
        ['/path/filename.csv', 'filename.csv'],
        ['docId__filename.pdf', 'filename.pdf'],
        ['/full/path/to/a1b2c3__important document.txt', 'important document.txt'],
        ['/path/to/xyz__my__complex__filename.jpg', 'my__complex__filename.jpg'],
        ['/path/__filename_with_leading_underscores.png', 'filename_with_leading_underscores.png'],
        ['/path/document_without_separator.docx', 'document_without_separator.docx'],
        ['/path/123__file.name.with.dots.xlsx', 'file.name.with.dots.xlsx'],
        ['/path/123____empty_segment.txt', '__empty_segment.txt'],
        ['__just_separators.txt', 'just_separators.txt'],
        ['/path/123__.ext', '.ext'],
        ['/path/123__', ''],
    ])('handles ONEPASSWORD provider with path %s', (inputPath, expectedResult) => {
        expect(getImportFilename(inputPath, ImportProvider.ONEPASSWORD)).toBe(expectedResult);
    });
});

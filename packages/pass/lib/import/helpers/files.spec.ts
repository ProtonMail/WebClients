import { getImportFilename } from '@proton/pass/lib/import/helpers/files';
import { ImportProvider } from '@proton/pass/lib/import/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

const fileID = uniqueId(16);

describe('`getImportFilename`', () => {
    test.each([
        [`/path/export.${fileID}.csv`, 'export.csv'],
        ['export.csv', 'export.csv'],
        [`/a/b/c/export.${fileID}.csv`, 'export.csv'],
        [`/path/${fileID}.csv`, `${fileID}.csv`],
        [`${fileID}.csv`, `${fileID}.csv`],
        [`.${fileID}.dot`, '.dot'],
        [`.local.${fileID}.dot`, '.local.dot'],
        [`.dot`, '.dot'],
        [`/a/b/c/${fileID}.csv`, `${fileID}.csv`],
        [`/a/a.b.${fileID}.csv`, 'a.b.csv'],
        ['tools.0195dcd0-8e3b-7973-bd6e-f993cd92d77e.zip', 'tools.zip'],
        [`/a/noextension.${fileID}`, 'noextension'],
        [`/path/.${fileID}.exportfile`, '.exportfile'],
        [`/path/exportfile`, 'exportfile'],
        [`/path/exportfile.unknown`, 'exportfile.unknown'],
        [`/path/document.version.1.${fileID}.pdf`, 'document.version.1.pdf'],
        [`/path/complex.file.name.with.many.dots.${fileID}.txt`, 'complex.file.name.with.many.dots.txt'],
        [`/path/archive.tar.${fileID}.gz`, 'archive.tar.gz'],
        [`/path/document-with_special-chars.${fileID}.pdf`, 'document-with_special-chars.pdf'],
        [`/path/doc.${fileID}.pdf`, 'doc.pdf'],
        [`/path/文件.${fileID}.txt`, '文件.txt'],
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
        ['/path/123____filename.pdf', '__filename.pdf'],
        ['/path/123__my__actual__filename.pdf', 'my__actual__filename.pdf'],
        ['/path/123__文件.txt', '文件.txt'],
        ['/path/__doc.pdf', 'doc.pdf'],
    ])('handles ONEPASSWORD provider with path %s', (inputPath, expectedResult) => {
        expect(getImportFilename(inputPath, ImportProvider.ONEPASSWORD)).toBe(expectedResult);
    });
});

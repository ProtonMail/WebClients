import type JSZip from 'jszip';

/**
 * pptxgenjs 4.0.1 embeds a spreadsheet behind every chart (for "Edit Data") with a broken Excel
 * table in it: its range has a stray quote (`ref="A1:B6'"`, a typo in pptxgenjs's own source) and
 * its first column name doesn't match its empty header cell. PowerPoint and LibreOffice cope;
 * Keynote reports "The file format is invalid" and drops every chart. The chart data doesn't use
 * the table, so it's removed: the table part, its relationship and its content type. Verified in
 * Keynote on 2026-10-15: charts import as native, editable charts afterwards.
 */

type JSZipConstructor = typeof JSZip;

const TABLE_RELATIONSHIP = /<Relationship [^>]*Type="[^"]*\/relationships\/table"[^>]*\/>/g;
const TABLE_CONTENT_TYPE = /<Override PartName="\/xl\/tables\/[^"]+"[^>]*\/>/g;

const repairWorkbook = async (Zip: JSZipConstructor, bytes: ArrayBuffer): Promise<ArrayBuffer> => {
    const workbook = await Zip.loadAsync(bytes);
    workbook.remove('xl/tables');

    for (const path of Object.keys(workbook.files)) {
        if (/^xl\/worksheets\/_rels\/.+\.rels$/.test(path)) {
            const rels = (await workbook.file(path)!.async('string')).replace(TABLE_RELATIONSHIP, '');
            if (rels.includes('<Relationship ')) {
                workbook.file(path, rels);
            } else {
                workbook.remove(path);
            }
        }
    }

    const contentTypes = workbook.file('[Content_Types].xml');
    if (contentTypes) {
        workbook.file('[Content_Types].xml', (await contentTypes.async('string')).replace(TABLE_CONTENT_TYPE, ''));
    }

    return workbook.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
};

/** Removes the broken table from every chart's embedded spreadsheet in a pptxgenjs file. */
export const repairChartWorkbooks = async (Zip: JSZipConstructor, pptx: ArrayBuffer): Promise<ArrayBuffer> => {
    const presentation = await Zip.loadAsync(pptx);
    const workbooks = Object.keys(presentation.files).filter((path) => {
        return /^ppt\/embeddings\/.+\.xlsx$/.test(path);
    });
    if (workbooks.length === 0) {
        return pptx;
    }

    for (const path of workbooks) {
        const bytes = await presentation.file(path)!.async('arraybuffer');
        presentation.file(path, await repairWorkbook(Zip, bytes));
    }

    return presentation.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
};

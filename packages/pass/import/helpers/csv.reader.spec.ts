import { readCSV } from './csv.reader';
import { ImportReaderError } from './reader.error';

type CSVItem = { id: string; name: string };

describe('readCSV', () => {
    it('should read CSV data with expected headers', async () => {
        const csvContent = 'id,name\n1,John Doe\n2,Jane Doe\n3,Bob Smith\n';
        const data = await readCSV<CSVItem>(csvContent, ['id', 'name']);

        expect(data).toEqual([
            { id: '1', name: 'John Doe' },
            { id: '2', name: 'Jane Doe' },
            { id: '3', name: 'Bob Smith' },
        ]);
    });

    it('should read CSV data with extra headers not in expected headers', async () => {
        const csvContent = 'id,name,age\n1,John Doe,20\n2,Jane Doe,21\n3,Bob Smith,22\n';
        const data = await readCSV<CSVItem>(csvContent, ['id', 'name']);

        expect(data).toEqual([
            { id: '1', name: 'John Doe', age: '20' },
            { id: '2', name: 'Jane Doe', age: '21' },
            { id: '3', name: 'Bob Smith', age: '22' },
        ]);
    });

    it('should throw error if CSV is empty', async () => {
        await expect(readCSV<CSVItem>('', [])).rejects.toThrow(new ImportReaderError('Empty CSV file'));
        await expect(readCSV<CSVItem>('id,name', [])).rejects.toThrow(new ImportReaderError('Empty CSV file'));
    });

    it('should throw error if CSV file has missing headers', async () => {
        const csvContent = 'id\n1\n2\n3\n';
        await expect(readCSV<CSVItem>(csvContent, ['id', 'name'])).rejects.toThrow(
            new ImportReaderError('CSV file is missing expected headers: name')
        );
    });

    it('should throw error if CSV file has invalid content', async () => {
        const csvContent = 'id,name\n1,John Doe\n2\n3,Bob Smith\n';
        await expect(readCSV<CSVItem>(csvContent, ['id', 'name'])).rejects.toThrow(
            new ImportReaderError('Too few fields: expected 2 fields but parsed 1')
        );
    });
});

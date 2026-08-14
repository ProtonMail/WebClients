export type SpreadsheetTableSection = {
    title?: string;
    csv: string;
};

export function parseCSVContent(content: string): string[][] {
    const lines = content.split('\n').filter((line) => line.trim());
    const rows: string[][] = [];

    for (const line of lines) {
        const row: string[] = [];
        let current = '';
        let inQuotes = false;
        let i = 0;

        while (i < line.length) {
            const char = line[i];

            if (char === '"' && !inQuotes) {
                inQuotes = true;
            } else if (char === '"' && inQuotes) {
                if (line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else if (char === ',' && !inQuotes) {
                row.push(current.trim());
                current = '';
            } else {
                current += char;
            }

            i++;
        }

        row.push(current.trim());
        rows.push(row);
    }

    return rows;
}

export function extractSpreadsheetTableSections(content: string): SpreadsheetTableSection[] {
    const trimmed = content.trim();
    if (!trimmed) {
        return [];
    }

    if (!trimmed.includes('```csv')) {
        return [{ csv: trimmed }];
    }

    const sections: SpreadsheetTableSection[] = [];
    const sectionPattern = /(?:^|\n)Sheet: ([^\n]+)\n```csv\n([\s\S]*?)```/g;
    let match: RegExpExecArray | null;

    while ((match = sectionPattern.exec(trimmed)) !== null) {
        const csv = match[2].trim();
        if (csv) {
            sections.push({ title: match[1].trim(), csv });
        }
    }

    if (sections.length > 0) {
        return sections;
    }

    const fencePattern = /```csv\n([\s\S]*?)```/g;
    while ((match = fencePattern.exec(trimmed)) !== null) {
        const csv = match[1].trim();
        if (csv) {
            sections.push({ csv });
        }
    }

    return sections.length > 0 ? sections : [{ csv: trimmed }];
}

export function getPrimarySpreadsheetTableCsv(content: string): string {
    return extractSpreadsheetTableSections(content)[0]?.csv ?? '';
}

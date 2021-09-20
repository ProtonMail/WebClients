export function mockGlobalFile() {
    // @ts-ignore
    global.File = class MockFile {
        name: string;

        size: number;

        type: string;

        parts: (string | Blob | ArrayBuffer | ArrayBufferView)[];

        properties?: FilePropertyBag;

        constructor(
            parts: (string | Blob | ArrayBuffer | ArrayBufferView)[],
            name: string,
            properties?: FilePropertyBag
        ) {
            this.parts = parts;
            this.name = name;
            this.size = 42;
            this.type = 'txt';
            this.properties = properties;
        }
    };
}

export function testFile(filename: string) {
    return new File([''], filename);
}

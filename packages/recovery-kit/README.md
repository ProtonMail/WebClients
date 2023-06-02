# Recovery kit

Enables the programmatic generation of the recovery kit pdf.

## Usage

```ts
import { generatePDFKit } from '@proton/recovery-kit';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';

const pdf = await generatePDFKit({
    emailAddress: 'eric.norbert@gmail.com',
    recoveryPhrase: 'auto pottery age relief turkey face tide useful near lottery alley wolf',
    password: '12341234',
});

// Browser
const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
downloadFile(blob, 'recovery_kit.pdf');
```

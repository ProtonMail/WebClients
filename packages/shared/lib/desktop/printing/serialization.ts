async function getSanitizedStyles(doc: Document): Promise<string[]> {
    const styles: string[] = [];
    doc.querySelectorAll('style').forEach((tag) => styles.push(tag.textContent || ''));

    for (const sheet of Array.from(doc.styleSheets)) {
        try {
            if (sheet.href) {
                const response = await fetch(sheet.href);
                styles.push(await response.text());
            } else if (sheet.cssRules) {
                styles.push(
                    Array.from(sheet.cssRules)
                        .map((r) => r.cssText)
                        .join('\n')
                );
            }
        } catch (_) {
            continue;
        }
    }

    return styles.map((style) => style.replace(/javascript\s*:/gi, ''));
}

function convertImagesToBase64(doc: Document): Map<number, string> {
    const images = doc.querySelectorAll('img');
    const imageData = new Map<number, string>();

    for (let idx = 0; idx < images.length; idx++) {
        const img = images[idx] as HTMLImageElement;

        if (img.src.startsWith('data:')) {
            imageData.set(idx, img.src);
            continue;
        }

        // Skip not loaded images.
        if (!img.complete || img.naturalHeight === 0 || img.naturalWidth === 0) {
            continue;
        }

        try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');
                imageData.set(idx, dataUrl);
            }

            // Will be cleaned up by GC, setting size to 0 should release memory.
            canvas.width = 0;
            canvas.height = 0;
        } catch (_) {
            continue;
        }
    }

    return imageData;
}

function sanitizeDocument(doc: Document): Document {
    doc.querySelectorAll('script').forEach((el) => el.remove());

    doc.querySelectorAll('*').forEach((el) => {
        Array.from(el.attributes).forEach((attr) => {
            if (attr.name.startsWith('on')) {
                el.removeAttribute(attr.name);
            }
        });

        if (el.hasAttribute('href')) {
            const href = el.getAttribute('href') || '';
            if (href.toLowerCase().startsWith('javascript:')) {
                el.removeAttribute('href');
            }
        }

        if (el.hasAttribute('src')) {
            const src = el.getAttribute('src') || '';
            if (src.toLocaleLowerCase().startsWith('javascript:')) {
                el.removeAttribute('src');
            }
        }
    });

    return doc;
}

export async function serializeAndSanitizeDocument(doc: Document): Promise<string> {
    const sanitizedStyles = await getSanitizedStyles(doc);

    // Convert images to base64 data as they are proxied through API and cannot be accessed by new electron window.
    const imageData = convertImagesToBase64(doc);

    const sanitizedDoc = sanitizeDocument(doc.cloneNode(true) as Document);

    // Apply converted imges
    const clonedImages = sanitizedDoc.querySelectorAll('img');
    for (let i = 0; i < clonedImages.length; i++) {
        const img = clonedImages[i];

        if (imageData.has(i)) {
            // Remove lazy loading, otherwise images might not be present in the print doc
            img.src = imageData.get(i)!;
            img.removeAttribute('loading');
            img.removeAttribute('decoding');
            img.setAttribute('decoding', 'sync');
        } else {
            img.remove();
        }
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; script-src 'none';">
    <style>
        body { margin: 0; padding: 20px; }
        @media print { body { padding: 0; } }
        ${sanitizedStyles.join('\n\n')}
    </style>
    </head>
    <body>
    ${sanitizedDoc.body.innerHTML}
    </body>
    </html>`.trim();

    return htmlContent;
}

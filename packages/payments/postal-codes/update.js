const https = require('https');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

function fetchHTML(url) {
    return new Promise((resolve, reject) => {
        https
            .get(url, (response) => {
                let data = '';

                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    resolve(data);
                });
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

async function fetchJSON(url) {
    try {
        const data = await fetchHTML(url);
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error fetching JSON from ${url}:`, error);
        return null;
    }
}

async function saveToFile(data) {
    const filePath = path.join(__dirname, 'us-zip-codes-patterns.json');
    await fs.writeFile(filePath, JSON.stringify(data, null, 4));
    console.log(`Data successfully saved to ${filePath}`);
}

// Main function to process the data
async function getUSAddressData() {
    try {
        const baseUrl = 'https://chromium-i18n.appspot.com/ssl-address';
        const html = await fetchHTML(baseUrl);
        const $ = cheerio.load(html);

        // Object to store US address data
        const usAddressDataRaw = {};

        // Find all links that match the pattern data/US/*
        const promises = [];
        $('a').each((index, element) => {
            const text = $(element).text().trim();

            if (text.startsWith('data/US/')) {
                const url = `${baseUrl}/${text}`;
                promises.push(
                    fetchJSON(url).then((jsonData) => {
                        if (jsonData) {
                            // Use stateCode as the key
                            usAddressDataRaw[jsonData.key] = {
                                name: text,
                                url: url,
                                data: jsonData,
                            };
                        }
                    })
                );
            }
        });

        // Wait for all fetch operations to complete
        await Promise.all(promises);

        // sorting the results by state code.
        // It relies on the fact that internally V8 engine maintains the order of the keys in the object.
        const usAddressDataArray = Object.entries(usAddressDataRaw).sort((a, b) => a[0].localeCompare(b[0]));
        const usAddressData = {};
        for (const [key, value] of usAddressDataArray) {
            usAddressData[key] = value;
        }

        return usAddressData;
    } catch (error) {
        throw error;
    }
}

// Main execution
async function main() {
    const data = await getUSAddressData();
    await saveToFile(data);
    return data;
}

// Execute the function if running directly (not imported)
if (require.main === module) {
    void main();
}

module.exports = {
    getUSAddressData,
};

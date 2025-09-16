const fs = require('fs');
const path = require('path');

class Utility {
    constructor() {
        this.charsWithQuoteSet = new Set([',', '\n', '\r', '"']);
    }

    getMasterDataFilePath() {
        return '';
    }

    extractOtp(dataRow) {
        return '';
    }

    readFileData() {
        let dataRows = [];
        const filePath = this.getMasterDataFilePath();

        if (filePath && fs.existsSync(filePath)) {
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.split(/\r?\n/).slice(1); // Skip header
                for (let line of lines) {
                    let columnValues = [];
                    if (this.tryGetDataRow(line, true, columnValues)) {
                        columnValues.pop(); // Remove last element
                        dataRows.push(columnValues);
                    }
                }
            } catch (e) {
                console.log(e.message);
            }
        }

        return dataRows.flat();
    }

    tryGetDataRow(line, skipEmptyRows, columnValues) {
        columnValues.length = 0;

        let chars = Array.from(line);
        let openingQuote = false;
        let sb = '';
        for (let i = 0; i < chars.length; i++) {
            let currentChar = chars[i];

            if (currentChar === '"') {
                openingQuote = !openingQuote;
            }

            if (!openingQuote && currentChar === ',') {
                columnValues.push(sb);
                sb = '';
            } else {
                sb += currentChar;
            }
        }
        columnValues.push(sb);

        let isCurrentRowEmpty = true;

        for (let i = 0; i < columnValues.length; i++) {
            let itemValue = columnValues[i].trim();

            if (itemValue.length > 0) {
                let startIndex = itemValue.startsWith('"') ? 1 : 0;
                let endIndex = itemValue.endsWith('"') ? itemValue.length - 1 : itemValue.length;

                let processedValue = '';
                let quoteIndex = -1;
                for (let j = startIndex; j < endIndex; j++) {
                    if (itemValue[j] === '"') {
                        if (j - quoteIndex !== 1) {
                            processedValue += '"';
                        }
                        quoteIndex = j;
                    } else {
                        processedValue += itemValue[j];
                    }
                }

                columnValues[i] = processedValue.trim();
            }

            if (columnValues[i] !== '') {
                isCurrentRowEmpty = false;
            }
        }

        if (skipEmptyRows && isCurrentRowEmpty) {
            columnValues.length = 0;
        }

        return columnValues.length > 0;
    }

    writeFile(dataRows) {
        let dataRow = [];
        const filePath = this.getMasterDataFilePath();

        if (filePath && fs.existsSync(filePath)) {
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.split(/\r?\n/).slice(1); // Skip header
                for (let line of lines) {
                    let columnValues = [];
                    if (this.tryGetDataRow(line, true, columnValues)) {
                        dataRow.push([...columnValues]);
                    }
                }
            } catch (e) {
                console.log(e.message);
            }
        }

        const res = dataRow;

        const folderPath = filePath ? path.dirname(filePath) : '';
        const outputFilePath = folderPath ? path.join(folderPath, 'output.csv') : 'output.csv';
        const failedCasesFilePath = folderPath ? path.join(folderPath, 'failedCases.csv') : 'failedCases.csv';

        let failCases = 0;
        let allLines = ["Message,Extracted,Expected"];
        let failedLines = ["Message,Extracted,Expected"];

        for (let it = 0; it < dataRows.length; it++) {
            let flag = false;
            console.log(it);
            console.log(res[it][0]);
            console.log(res[it][1]);
            if (dataRows[it].length !== 2 || ( dataRows[it][1].toLowerCase() !== res[it][1].toLowerCase())) {
                console.log(dataRow[it], 'new', dataRows[it])
                failCases++;
                flag = true;
            }

            let rows = [];
            for (let data of dataRows[it]) {
                let sb = '';
                let specialCharFound = false;

                for (let i = 0; i < data.length; i++) {
                    const currentChar = data[i];
                    sb += currentChar;

                    if (currentChar === '"') {
                        sb += currentChar;
                    }

                    if (this.charsWithQuoteSet.has(currentChar)) {
                        specialCharFound = true;
                    }
                }

                if (specialCharFound) {
                    sb = `"${sb}"`;
                }

                rows.push(sb);
            }

            rows.push(res[it][1]);
            allLines.push(rows.join(','));
            if (flag) {
                failedLines.push(rows.join(','));
            }
        }

        try {
            fs.writeFileSync(outputFilePath, allLines.join('\n'));
            fs.writeFileSync(failedCasesFilePath, failedLines.join('\n'));

            const accuracy = ((dataRows.length - failCases) / dataRows.length) * 100;
            console.log(`Accuracy: ${accuracy}%`);
            console.log(`CSV writing completed successfully: ${outputFilePath}`);
        } catch (ex) {
            console.log("Error writing CSV: " + ex.message);
        }
    }
}

module.exports = Utility;

import fs from 'fs';

/**
 * Writes a 2D array to a CSV file and displays an OTP extraction accuracy report.
 * @param {string} fileName The path to the CSV file to be created.
 * @param {string[][]} dataRows A 2D array of strings, where each inner array is a row.
 * @returns {boolean} True if writing was successful, false otherwise.
 */
export function writeFile(fileName, dataRows) {
	if (!dataRows || dataRows.length === 0) {
		console.log("Cannot process: Input data is empty.");
		return false;
	}

	const dataToAnalyze = dataRows.slice(1);
	const totalRecords = dataToAnalyze.length;
	let correctMatches = 0;

	if (totalRecords > 0) {
		for (const row of dataToAnalyze) {
			if (row.length >= 3) {   
				const expected = row[1]?.trim() ?? ""; 
				const extracted = row[2]?.trim() ?? "";
				if (expected.toLowerCase() === extracted.toLowerCase()) {
					correctMatches++;
				}
				else{
					console.log(row);
				}
			}
		}
	}

	const accuracy = (totalRecords > 0) ? (correctMatches / totalRecords) * 100.0 : 0.0;
	console.log("--- OTP Extraction Report ---");
	console.log(`Total Records Checked: ${totalRecords}`);
	console.log(`Correct Matches:       ${correctMatches}`);
	console.log(`Accuracy:              ${accuracy.toFixed(2)}%`);
	console.log("---------------------------");

	try {
		const csvRows = dataRows.map(rowData => {
			const cells = rowData.map(data => {
				const cell = data ?? "";
				if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
					return `"${cell.replace(/"/g, '""')}"`;
				}
				return cell;
			});
			return cells.join(',');
		});

		const csvContent = csvRows.join('\n');
		fs.writeFileSync(fileName, csvContent);

		console.log(`\nSuccessfully wrote data to '${fileName}'`);
		return true;
	} catch (ex) {
		console.log(`\nERROR writing file: ${ex.message}`);
		return false;
	}
}

/**
 * Reads a CSV file into a 2D array, correctly handling quoted fields.
 * @param {string} filePath The path to the CSV file.
 * @returns {string[][]} A 2D array of strings representing the CSV data.
 */
export function readCsv(filePath) {
	const allRows = [];

	try {
		 const content = fs.readFileSync(filePath, 'utf-8');
		 const lines = content.split(/\r?\n/).slice(1);

		for (const line of lines) {
			if (!line) continue;

			const fields = [];
			let currentField = '';
			let inQuotes = false;

			for (let i = 0; i < line.length; i++) {
				const char = line[i];

				if (inQuotes) {
					if (char === '"' && i < line.length - 1 && line[i + 1] === '"') {
						currentField += '"';
						i++;
					} else if (char === '"') {
						inQuotes = false;
					} else {
						currentField += char;
					}
				} else {
					if (char === ',') {
						fields.push(currentField.trim());
						currentField = '';
					} else if (char === '"' && currentField.length === 0) {
						inQuotes = true;
					} else {
						currentField += char;
					}
				}
			}
			fields.push(currentField.trim());
			if (fields.every(field => !field)) {
				continue;
			}
			allRows.push(fields);
		}
	} catch (ex) {
		if (ex.code === 'ENOENT') {
			console.log(`ERROR: File not found at '${filePath}'`);
		} else {
			console.log(`An error occurred: ${ex.message}`);
		}
	}
	return allRows;
}
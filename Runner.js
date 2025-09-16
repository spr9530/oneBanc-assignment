const Child = require('./Child');
const { readCsv, writeFile } = require('./csv-javascript');

function main() {
    const obj = new Child();

    const csvData = readCsv('./master_data.csv');
    const extractedData = new Array(csvData.length).fill(null).map(() => new Array(3));

    for (let i = 0; i < csvData.length; i++) {
        const otp = obj.extractOtp(csvData[i][0]);
        extractedData[i][0] = csvData[i][0];
        extractedData[i][1] = csvData[i][1];
        extractedData[i][2] = csvData[i][1] ? otp : undefined;  //because in some cases read csv return undefined that's why
    }

    writeFile('./result.csv', extractedData);
}

main();

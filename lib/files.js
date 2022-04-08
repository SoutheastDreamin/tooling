const csv = require('csvtojson');
const fs = require('fs');

/**
 * Load the CSV from disk
 * @param {String} filename The CSV file to load
 * @returns {Promise} A promise for the CSV data
 */
function csvLoad(filename) {
    return new Promise(function (resolve, reject) {
        csv()
            .fromFile(filename)
            .then(resolve)
            .catch(reject);
    });
}

/**
 * Reads a file from disk
 * @param {String} filename The filename
 * @returns {Promise} A promise for the file's data
 */
function readFile(filename) {
    return new Promise(function (resolve, reject) {
        fs.readFile(filename, 'utf8', function (error, data) {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
}

module.exports = {
    read: readFile,
    csv: {
        load: csvLoad
    }
};
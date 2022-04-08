const jsforce = require('jsforce');
const lodash = require('lodash');

const config = require('../credentials.json');

/**
 * Quotes a string
 * @param {String} s The string to quote
 * @returns {String} The quoted string
 */
function quoteString(s) {
    return `'${s}'`;
}

/**
 * Quotes an array of strings
 * @param {String[]} strings An array of strings to quote
 * @returns {String[]} The quoted strings
 */
function quoteStrings(strings) {
    return lodash.map(strings, quoteString);
}

/**
 * Generates the query string
 * @param {String[]} fields The fields to query
 * @param {String} object_name The object name
 * @param {String} where_clause The where clause
 * @param {String} order_clause The order clause
 * @param {String} limit_count The limit count
 * @returns {String} The query
 */
function generateQuery(fields, object_name, where_clause, order_clause, limit_count) {
    let parts = [
        'select',
        fields,
        `from ${object_name}`
    ];

    if (lodash.isArray(where_clause)) {
        parts.push(`where ${lodash.join(where_clause, ' AND ')}`);
    } else if (where_clause) {
        parts.push(`where ${where_clause}`);
    }

    if (order_clause) {
        parts.push(`order by ${order_clause}`);
    }

    if (limit_count) {
        parts.push(`limit ${limit_count}`);
    }

    return lodash.join(parts, ' ');
}

/**
 * Gets the record type by name
 * @param {String} name The record type name
 * @returns {String} The query
 */
function recordTypeByName(name) {
    return generateQuery(
        [ 'Id' ],
        'RecordType',
        `Name = ${quoteString(name)}`,
        undefined,
        1
    );
}

/**
 * Gets contacts with matching email address
 * @param {String[]} emails The contact emails
 * @returns {String} The query
 */
function contactByEmail(emails) {
    return generateQuery(
        [ 'Id', 'Email' ],
        'Contact',
        [
            `Email in (${quoteStrings(emails).join(',')})`
        ],
        'CreatedDate desc'
    );
}

/**
 * Gets all the tracks
 * @returns {String} The query
 */
function trackList() {
    return generateQuery(
        [ 'Id', 'Name' ],
        'Track__c'
    );
}

/**
 * Logs into Salesforce
 * @returns {Promise} A promise for the connection
 */
function login() {
    return new Promise(function (resolve, reject) {
        const conn = new jsforce.Connection({
            maxRequest: 200
        });

        conn.login(
            config.salesforce.user,
            config.salesforce.pass + config.salesforce.token,
            function (error) {
                if (error) {
                    reject(error);
                } else {
                    resolve(conn);
                }
            });
    });
}

/**
 * Queries Salesforce
 * @param {Object} conn The Salesforce connection
 * @param {String} query The query
 * @returns {Promise} A promise for the query results
 */
function query(conn, query) {
    return new Promise(function (resolve, reject) {
        conn.query(query, function (error, res) {
            if (error) {
                reject(error);
            } else {
                resolve(res.records);
            }
        });
    });
}

/**
 * Inserts a set of records
 * @param {Object} conn The Salesforce connection
 * @param {String} object_name The object name
 * @param {Object[]} records The records to insert
 * @returns {Promise} A promise for when the insert is complete
 */
function insert(conn, object_name, records) {
    return new Promise(function (resolve, reject) {
        conn.sobject(object_name).create(records, function (error, res) {
            if (error) {
                reject(error);
            } else {
                resolve(res);
            }
        });
    });
}

module.exports = {
    login: login,
    query: query,
    insert: insert,
    query_builder: {
        contact: {
            by_email: contactByEmail
        },
        record_type: {
            by_name: recordTypeByName
        },
        track: {
            all: trackList
        }
    }
};
const commander = require('commander');
const lodash = require('lodash');

const files = require('../lib/files');
const sfdc = require('../lib/sfdc');

const RECORD_TYPE_NAME = 'Chosen/Picked';

const program = new commander.Command();

program
    .name('Loads Session Data')
    .description('Reads a selected session CSV and loads that data into Salesforce')
    .version('1.0.0')
    .requiredOption('--csv <file>')
    .requiredOption('--eventid <id>');

program.parse();

const options = program.opts();

let query_bound, insert_bound, load_bound, record_type_id;
let contact_map = {};
let track_map = {};

/**
 * Binds the variables with the connection
 * @param {Object} conn The Salesforce connection
 * @returns {Promise} A promise for when the variables are bound
 */
function bindVariables(conn) {
    return new Promise(function (resolve) {
        load_bound = files.csv.load.bind(undefined, options.csv);
        query_bound = sfdc.query.bind(undefined, conn);
        insert_bound = sfdc.insert.bind(undefined, conn);

        resolve();
    });
}

/**
 * Filters out only the selected sessions
 * @param {Object[]} sessions The session data
 * @returns {Promise} A promise for the filtered data
 */
function filterSelected(sessions) {
    return new Promise(function (resolve) {
        resolve(lodash.filter(sessions, 'selected'));
    });
}

/**
 * Gets the record type id for selected sessions
 * @returns {Promise} A promise for when the record type id is gotten
 */
function getRecordType() {
    return new Promise(function (resolve, reject) {
        const query = sfdc.query_builder.record_type.by_name(RECORD_TYPE_NAME);

        query_bound(query)
            .then(function (record_type) {
                record_type_id = record_type[0].Id;
                resolve();
            })
            .catch(reject);
    });
}

/**
 * Builds the track map
 * @returns {Promise} A promise for when the track map has been built
 */
function getTrackMap() {
    return new Promise(function (resolve, reject) {
        const query = sfdc.query_builder.track.all();

        query_bound(query)
            .then(function (tracks) {
                lodash.each(tracks, function (track) {
                    const formatted_name = lodash.toLower(lodash.replace(track.Name, / /g, '_'));
                    track_map[formatted_name] = track.Id;
                });

                resolve();
            })
            .catch(reject);
    });
}

/**
 * Builds a contact map of email to contact id
 * @param {Object[]} sessions The sessions
 * @returns {Promise} A promise for when the contact map has been built
 */
function getContactMap(sessions) {
    return new Promise(function (resolve, reject) {
        const emails = lodash.uniq(lodash.map(sessions, 'email'));
        const query = sfdc.query_builder.contact.by_email(emails);

        query_bound(query)
            .then(function (contacts) {
                lodash.each(contacts, function (contact) {
                    if (!contact_map[contact.Email]) {
                        contact_map[contact.Email] = contact.Id;
                    }
                });
                resolve(sessions);
            })
            .catch(reject);
    });
}

/**
 * Creates the contacts we don't have
 * @param {Object[]} sessions The sessions
 * @returns {Promise} A promise for when the contacts have been created
 */
function createContacts(sessions) {
    return new Promise(function (resolve, reject) {
        const new_contacts = [];

        lodash.each(sessions, function (session) {
            if (!contact_map[session.email]) {
                new_contacts.push({
                    FirstName: session.first_name,
                    LastName: session.last_name,
                    Email: session.email
                });
            }
        });

        if (lodash.size(new_contacts) === 0) {
            resolve(sessions);
        } else {
            insert_bound('Contact', new_contacts)
                .then(function (results) {
                    lodash.each(results, function (result) {
                        contact_map[result.Email] = result.Id;
                    });

                    resolve(sessions);
                })
                .catch(reject);
        }
    });
}

/**
 * Writes the session data out to the schedule JSON
 * @param {Object[]} sessions The selected sessions
 * @returns {Promise} A promise for when the session data is written
 */
function writeSessionData(sessions) {
    return new Promise(function (resolve, reject) {
        const sessions_to_create = [];
        const truncOpts = {
            length: 80
        };

        lodash.each(sessions, function (session) {
            sessions_to_create.push({
                RecordTypeId: record_type_id,
                Name: lodash.truncate(session.session_title, truncOpts),
                Session_Abstract__c: session.session_abstract,
                Event__c: options.eventid,
                Main_Presenter__c: contact_map[session.email],
                Track__c: track_map[session.track]
            });
        });

        insert_bound('Session__c', sessions_to_create)
            .then(function (results) {
                lodash.each(results, function (result) {
                    console.log(result);
                });
                resolve(sessions);
            })
            .catch(reject);
    });
}

/**
 * Runs the actions
 * @returns {Promise} A promise for when all the actions have completed
 */
function run() {
    return new Promise(function (resolve, reject) {
        getRecordType()
            .then(getTrackMap)
            .then(load_bound)
            .then(filterSelected)
            .then(getContactMap)
            .then(createContacts)
            .then(writeSessionData)
            .catch(reject)
            .finally(resolve);
    });
}

sfdc.login()
    .then(bindVariables)
    .then(run)
    .catch(console.error);
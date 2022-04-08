const commander = require('commander');
const lodash = require('lodash');

const files = require('../lib/files');
const sessionUtils = require('../lib/sessions');
const templates = require('../lib/templates');
const mailgun = require('../lib/mailgun');

const program = new commander.Command();

program
    .name('Loads Session Data')
    .description('Reads a selected session CSV and loads that data into Salesforce')
    .version('1.0.0')
    .requiredOption('--csv <file>')
    .requiredOption('--year <year>');

program.parse();

const options = program.opts();
const TEMPLATE_PATH = `template/${options.year}/speakers/acceptance`;

/**
 * Filters out selected sessions and groups them by email
 * @param {Objects[]} sessions The sessions
 * @returns {Promise} A promise for the filtered and grouped sessions
 */
function filterAndGroup(sessions) {
    return new Promise(function (resolve) {
        resolve(
            sessionUtils.groupByEmail(
                lodash.filter(sessions, 'selected')
            )
        );
    });
}

/**
 * Emails the sessions
 * @param {Object} sessions The map of emails to sessions
 * @returns {Promise} A promise for when the emails were sent
 */
function emailSessions(sessions) {
    return new Promise(function (resolve, reject) {
        templates.email.get(TEMPLATE_PATH)
            .then(function (template) {
                const promises = [];

                lodash.each(sessions, function (session) {
                    promises.push(mailgun.send(template, session));
                });

                Promise.allSettled(promises)
                    .then(function (results) {
                        const failures = [];
                        let count_success = 0;
                        let count_failure = 0;

                        lodash.each(results, function (result) {
                            if (result.status === 'fulfilled') {
                                count_success += 1;
                            } else {
                                count_failure += 1;
                                failures.push(result.reason);
                            }
                        });

                        console.log(`Sent ${count_success} emails successfully`);
                        console.log(`Had ${count_failure} failures`);
                        console.log(failures);

                        resolve();
                    });
            })
            .catch(reject);
    });
}

files.csv.load(options.csv)
    .then(filterAndGroup)
    .then(sessionUtils.transformSessionMap)
    .then(emailSessions)
    .catch(console.error);
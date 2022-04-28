const commander = require('commander');
const lodash = require('lodash');

const files = require('../lib/files');
const sessionUtils = require('../lib/sessions');

const program = new commander.Command();

program
    .name('Sends acceptance email to hots')
    .description('Reads a selected hot CSV and emails the acceptance hot owners')
    .version('1.0.0')
    .requiredOption('--csv <file>')
    .requiredOption('--year <year>');

program.parse();

const options = program.opts();
const TEMPLATE_PATH = `template/${options.year}/hot/acceptance`;

const emailSessions_bound = sessionUtils.emailSessions.bind(null, TEMPLATE_PATH);

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

files.csv.load(options.csv)
    .then(filterAndGroup)
    .then(sessionUtils.transformSessionMap)
    .then(emailSessions_bound)
    .catch(console.error);
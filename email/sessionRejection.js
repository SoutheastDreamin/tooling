const commander = require('commander');
const lodash = require('lodash');

const files = require('../lib/files');
const sessionUtils = require('../lib/sessions');

const program = new commander.Command();

program
    .name('Sends rejection email to speakers')
    .description('Reads a selected session CSV and emails the rejected session owners')
    .version('1.0.0')
    .requiredOption('--csv <file>')
    .requiredOption('--year <year>');

program.parse();

const options = program.opts();
const TEMPLATE_PATH = `template/${options.year}/speakers/rejection`;

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
                lodash.reject(
                    lodash.reject(sessions, 'selected'),
                    'duplicate'
                )
            )
        );
    });
}

files.csv.load(options.csv)
    .then(filterAndGroup)
    .then(sessionUtils.transformSessionMap)
    .then(emailSessions_bound)
    .catch(console.error);
const lodash = require('lodash');

const templates = require('./templates');
const mailgun = require('../lib/mailgun');

/**
 * Emails the sessions
 * @param {String} template_path The path to the templates
 * @param {Object} sessions The map of emails to sessions
 * @returns {Promise} A promise for when the emails were sent
 */
function emailSessions(template_path, sessions) {
    return new Promise(function (resolve, reject) {
        templates.email.get(template_path)
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

/**
 *
 * @param {Object[]} sessions The sessions
 * @returns {Object} A map of emails to list of sessions
 */
function groupByEmail(sessions) {
    const by_email = {};

    lodash.each(sessions, function (session) {
        if (!by_email[session.email]) {
            by_email[session.email] = [];
        }

        by_email[session.email].push(session);
    });

    return by_email;
}

/**
 * Transforms the session map to a presenter list
 * @param {Object} session_map The map of email to sessions
 * @returns {Object[]} A list of presenters with sessions
 */
function transformSessionMap(session_map) {
    return new Promise(function (resolve) {
        const results = [];

        lodash.each(session_map, function (sessions, email) {
            const speaker = {
                name: sessions[0].first_name,
                email: email,
                sessions: []
            };

            lodash.each(sessions, function (session) {
                speaker.sessions.push({
                    title: session.session_title
                });
            });

            results.push(speaker);
        });

        resolve(results);
    });
}

module.exports = {
    groupByEmail: groupByEmail,
    transformSessionMap: transformSessionMap,
    emailSessions: emailSessions
};
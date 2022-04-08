const lodash = require('lodash');

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
    transformSessionMap: transformSessionMap
};
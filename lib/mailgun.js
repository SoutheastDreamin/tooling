var config = require('../credentials.json');

/**
 * Sends and email via mailgun
 * @param {Object} template The template
 * @param {Object} session The session
 * @returns {Promise} A promise for when the email has been sent
 */
var send = function (template, session) {
    return new Promise(function (resolve, reject) {
        const mailgun = require('mailgun-js')({ // eslint-disable-line global-require
            apiKey: config.mailgun.key,
            domain: config.mailgun.domain
        });

        if (session.ManagerEmail === undefined) {
            session.ManagerEmail = 'sessions@sedreamin.com';
        }

        var data = {
            to: session.email,
            //to: 'patrick@deadlypenguin.com',
            from: 'Southeast Dreamin <sessions@sedreamin.com>',
            subject: template.subject(session),
            text: template.text(session),
            html: template.html(session),
            'h:Reply-To': session.ManagerEmail
        };

        mailgun.messages().send(data, function (error, body) {
            if (error) {
                reject(error);
            } else {
                resolve(body);
            }
        });
    });
};

module.exports = {
    send: send
};
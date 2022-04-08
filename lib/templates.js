const handlebars = require('handlebars');
const path = require('path');

const files = require('./files');

const BODY_HTML = 'body.html';
const BODY_TXT = 'body.txt';
const SUBJECT = 'subject.txt';

/**
 * Compiles the template
 * @param {String} folder The root folder
 * @param {String} name The template name
 * @returns {Promise} A promise for the compiled template
 */
function readTemplate(folder, name) {
    return new Promise(function (resolve, reject) {
        const filename = path.join(folder, name);
        files.read(filename)
            .then(function (data) {
                resolve(handlebars.compile(data));
            })
            .catch(reject);
    });
}

/**
 * Returns a full email template
 * @param {String} folder The folder path
 * @returns {Promise} A promise for the loaded email template
 */
function getEmailTemplate(folder) {
    return new Promise(function (resolve, reject) {
        const template = {
            subject: undefined,
            html: undefined,
            text: undefined
        };

        readTemplate(folder, SUBJECT)
            .then(function (subject) {
                template.subject = subject;

                readTemplate(folder, BODY_HTML)
                    .then(function (html) {
                        template.html = html;

                        readTemplate(folder, BODY_TXT)
                            .then(function (text) {
                                template.text = text;

                                resolve(template);
                            })
                            .catch(reject);
                    })
                    .catch(reject);
            })
            .catch(reject);
    });
}

module.exports = {
    email: {
        get: getEmailTemplate
    },
    read: readTemplate
};
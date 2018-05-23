const request = require("request-promise-native");
const _ = require("lodash/fp");

function defaultHeaders(token) {
    return {
        Authorization: "token " + token,
        Accept: "application/vnd.github.v3+json"
    };
}

function labelRequest(httpMethod, href, token, label) {
    return request({
        uri: href,
        headers: defaultHeaders(token),
        method: httpMethod,
        body: label,
        json: true
    });
}
function handleError(error) {
    if (error.statusCode == 404) {
        return `got 404 for ${error.options.uri}`;
    } else if (error.statusCode == 401) {
        return `provided token lacks permissions for ${error.options.uri}`;
    }
    return `unknown error: ${error}`;
}

function init(token, endpoint) {
    const baseUrl = endpoint + "/api/v3";
    return {
        getRepo: function(owner, repo) {
            return request({
                uri: `${baseUrl}/repos/${owner}/${repo}`,
                headers: defaultHeaders(token),
                json: true
            }).catch(handleError);
        },
        listOrgRepos: function(owner) {
            return request({
                uri: `${baseUrl}/orgs/${owner}/repos`,
                headers: defaultHeaders(token),
                json: true
            }).catch(error=>{
                if (error.statusCode == 404) {
                    return [];
                }
                throw error;
            });
        },
        listUserRepos: function(owner) {
            return request({
                uri: `${baseUrl}/users/${owner}/repos`,
                headers: defaultHeaders(token),
                json: true
            });
        },
        listRepos: function(owner) {
            return Promise.all([
                this.listOrgRepos(owner),
                this.listUserRepos(owner)
            ]).then(_.flatten);
        },
        listLabels: function(repoUrl) {
            console.log(repoUrl);
            return request({
                uri: `${repoUrl}/labels`,
                headers: defaultHeaders(token),
                json: true
            }).catch(handleError);
        },
        createLabel: function(label, repoUrl) {
            return labelRequest("POST", `${repoUrl}/labels`, token, label).catch(handleError);
        },
        updateLabel: function(label) {
            return labelRequest("PATCH", label.url, token, label).catch(handleError);
        },
        deleteLabel: function(label) {
            return labelRequest("DELETE", label.url, token, label).catch(handleError);
        }
    };
}

module.exports.init = init;
module.exports.defaultHeaders = defaultHeaders;

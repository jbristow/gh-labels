const request = require("request-promise-native");
const _ = require("lodash/fp");

function handleError(errorObj) {
    const { options = { uri: "unknown" }, error = { message: "unknown" } } = errorObj;
    if (error.statusCode === 404) {
        return Promise.reject(new Error(`got 404 for ${options.uri}`));
    }
    if (error.statusCode === 401) {
        return Promise.reject(new Error(`provided token lacks permissions for ${options.uri}`));
    }
    if (error.statusCode === 422) {
        const errorMsg = _.join(", ")(error.error.errors.map(e => `field "${e.field}" ${e.code}`));
        return Promise.reject(new Error(`invalid label: ${error.message}: ${errorMsg}.`));
    }
    return Promise.reject(new Error(`unknown error: ${errorObj}`));
}

class Client {
    constructor(token, baseUrl) {
        this.token = token;
        this.baseUrl = baseUrl;
        this.userAgent = "gh-labels auto-labeler";
    }

    getRepo(owner, repo) {
        return request({
            uri: `${this.baseUrl}/repos/${owner}/${repo}`,
            headers: this.defaultHeaders(this.token),
            json: true,
        }).catch(handleError);
    }

    listOrgRepos(owner) {
        return request({
            uri: `${this.baseUrl}/orgs/${owner}/repos`,
            headers: this.defaultHeaders(this.token),
            json: true,
        }).catch((error) => {
            if (error.statusCode === 404) {
                return [];
            }
            throw error;
        });
    }

    listUserRepos(owner) {
        return request({
            uri: `${this.baseUrl}/users/${owner}/repos`,
            headers: this.defaultHeaders(this.token),
            json: true,
        });
    }

    listRepos(owner) {
        return Promise.all([
            this.listOrgRepos(owner),
            this.listUserRepos(owner),
        ]).then(_.flatten);
    }

    listLabels(repoUrl) {
        return request({
            uri: `${repoUrl}/labels`,
            headers: this.defaultHeaders(),
            json: true,
        }).catch(handleError);
    }

    createLabel(label, repoUrl) {
        return this.labelRequest("POST", `${repoUrl}/labels`, this.token, this.label)
            .catch(handleError);
    }

    updateLabel(label) {
        return this.labelRequest("PATCH", label.url, label).catch(handleError);
    }

    deleteLabel(label) {
        return this.labelRequest("DELETE", label.url, label).catch(handleError);
    }

    labelRequest(httpMethod, href, label) {
        return request({
            uri: href,
            headers: this.defaultHeaders(),
            method: httpMethod,
            body: label,
            json: true,
        });
    }

    defaultHeaders() {
        return {
            Authorization: `token ${this.token}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": this.userAgent,
        };
    }
}

module.exports = Client;

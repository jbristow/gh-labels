import axios from "axios";
import _ from "lodash/fp.js";

async function handleError(errorObj) {
    const { config = { url: "unknown" } } = errorObj;
    const response = errorObj.response ? errorObj.response : {};
    if (response.status === 404) {
        throw new Error(`got 404 for ${config.url}`);
    }
    if (response.status === 401) {
        throw new Error(`provided token lacks permissions for ${config.url}`);
    }
    if (response.status === 422) {
        const { data = { message: "unknown" } } = response;
        const errorMsg = _.join(", ")(
            data.error.errors.map((e) => `field "${e.field}" ${e.code}`),
        );
        throw new Error(
            `invalid label: ${data.message}: ${errorMsg}. ${errorObj}`,
        );
    }
    throw new Error(`unknown error: ${errorObj}`);
}

export default class Client {
    constructor(token, baseUrl) {
        this.instance = axios.create({
            baseURL: baseUrl,
            headers: {
                Authorization: `token ${token}`,
                Accept: "application/vnd.github.v3+json",
                "User-Agent": "gh-labels auto-labeler",
            },
        });
    }

    async getRepo(owner, repo) {
        try {
            const { data } = await this.instance.request({
                url: `/repos/${owner}/${repo}`,
            });
            return data;
        } catch (err) {
            return handleError(err);
        }
    }

    async listOrgRepos(owner) {
        try {
            const { data } = await this.instance.request({
                url: `/orgs/${owner}/repos`,
            });
            return data;
        } catch (err) {
            if (err.response.status === 404) {
                return [];
            }
            return handleError(err);
        }
    }

    async listUserRepos(owner) {
        try {
            const { data } = await this.instance.request({
                url: `/users/${owner}/repos`,
            });
            return data;
        } catch (err) {
            if (err.response.status === 404) {
                return [];
            }
            return handleError(err);
        }
    }

    async listRepos(owner) {
        return _.flatten(
            await Promise.all([
                this.listOrgRepos(owner),
                this.listUserRepos(owner),
            ]),
        );
    }

    async listLabels(repoUrl) {
        try {
            const { data } = await this.instance.request({
                url: `${repoUrl}/labels`,
            });
            return data;
        } catch (err) {
            return handleError(err);
        }
    }

    async createLabel(label, repoUrl) {
        return this.labelRequest("POST", `${repoUrl}/labels`, label);
    }

    async updateLabel(label) {
        return this.labelRequest("PATCH", label.url, label);
    }

    async deleteLabel(label) {
        return this.labelRequest("DELETE", label.url, label);
    }

    async labelRequest(httpMethod, href, label) {
        try {
            const { data } = await this.instance.request({
                url: href,
                method: httpMethod,
                data: label,
            });
            return data;
        } catch (err) {
            return handleError(err);
        }
    }
}

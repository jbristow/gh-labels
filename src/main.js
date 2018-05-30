const ghClient = require("./client.js");
const labelFile = require("./label_file.js");
const yargs = require("yargs");
const _ = require("lodash/fp");

const yargOpts = {
    file: {
        alias: "f",
        describe: "Path to a YAML file containing the label template",
        default: "labels.yml",
        type: "string"
    },
    token: {
        alias: "t",
        describe: "OAuth token for authenticating with Github",
        type: "string"
    },
    owner: {
        alias: "o",
        describe: "The name of the user or organization",
        type: "string"
    },
    owners: {
        describe: "Multiple owners.",
        type: "array",
        conflicts: [ "owner", "repo" ]
    },
    repo: {
        alias: "r",
        describe: "The name of the repository to apply the label template to",
        type: "string",
        conflicts: "owners"
    },
    endpoint: {
        alias: "e",
        default: "https://api.github.com",
        describe: "API endpoint to use",
        type: "string"
    },
    "dry-run": {
        alias: "d",
        describe: "Print what the program would do without actually doing it",
        type: "boolean"
    },
    "no-create": {
        describe: "Do not create labels missing from the repo but present in the file.",
        type: "boolean",
        default: false
    },
    "no-delete": {
        describe: "Do not delete labels present from the repo but missing in the file.",
        type: "boolean",
        default: false
    }
};

function promiseAll(labels, promisorFunc, logName, opts, repoUrl) {
    return Promise.all(_.map(label => {
        if (opts["dry-run"]) {
            return Promise.resolve(`[DRY RUN] ${logName} ${label.name}: ${label.color}`);
        }
        return promisorFunc(label, repoUrl).then((line) => {
            return `${logName} ${label.name}: ${label.color}`;
        }).catch(e => e);
    })(labels));
}

function createLabels(client, opts, existing, labels, repoUrl) {
    if (!opts["no-create"]) {
        const newLabels = _.differenceBy("name")(labels, existing);
        return promiseAll(newLabels, client.createLabel, "CREATE", opts, repoUrl);
    }
    return Promise.resolve([]);
}

function updateLabels(client, opts, existing, labels) {
    if (!opts["no-create"]) {
        const changedLabels = _.compact(_.map(el => {
            const matching = _.find(l => {
                return el.name === l.name && String(el.color) !== String(l.color);
            })(labels);
            if (matching) {
                return Object.assign({}, el, {
                    color: String(matching.color)
                });
            }
        })(existing));
        return promiseAll(changedLabels, client.updateLabel, "UPDATE", opts);
    }
    return Promise.resolve([]);
}

function deleteLabels(client, opts, existing, labels) {
    if (!opts["no-delete"]) {
        const labelsToDelete = _.differenceBy("name")(existing, labels);
        return promiseAll(labelsToDelete, client.deleteLabel, "DELETE", opts);
    }
    return Promise.resolve([]);
}

function processRepo(client, opts, repo, labels, existingLabels) {
        return Promise.all([
            repo.full_name,
            createLabels(client, opts, existingLabels, labels, repo.url),
            updateLabels(client, opts, existingLabels, labels),
            deleteLabels(client, opts, existingLabels, labels)
        ]).then(repoResult => {
            let output = _.flatten(repoResult);
            if (output.length === 1) {

                output = output.concat([ "NO CHANGES" ]);
            }
            return output;
        });
}

function main(args) {
    const opts = yargs.options(yargOpts).demandOption([ "file", "token" ]).parse(args);
    if (!_.has("owner")(opts) && !_.has("owners")(opts)) {
        yargs.showHelp();
        console.error("Must provide one of: owner, owners");
        process.exit();
    }
    const labels = labelFile.read(opts["file"]);
    const client = ghClient.init(opts["token"], opts["endpoint"]);
    new Promise((resolve) => {
        if (opts["owner"] !== undefined && opts["repo"] !== undefined) {
            resolve([ client.getRepo(opts["owner"], opts["repo"]) ]);
        } else if (_.has("owner")(opts)) {
            resolve(client.listRepos(opts["owner"]));
        }
        resolve(Promise.all(opts["owners"].map(owner => {
            return client.listRepos(owner);
        })).then(_.flatten));
    }).then(repoList => {
        return Promise.all(repoList.map(repo => {
            return Promise.resolve(repo).then(r => client.listLabels(r.url).then(existingLabels => processRepo(client, opts, r, labels, existingLabels)));
        })).then(_.flatten);
    }).then(results => {
        console.log(results.join("\n"));
    }).catch(error => {
        console.error(`gh-label failed: ${error}`);
    });
}

module.exports.main = main;

const yargs = require("yargs");
const _ = require("lodash/fp");
const Client = require("./client.js");
const labelFile = require("./label_file.js");

const yargOpts = {
    file: {
        alias: "f",
        describe: "Path to a YAML file containing the label template",
        default: "labels.yml",
        type: "string",
    },
    token: {
        alias: "t",
        describe: "OAuth token for authenticating with Github",
        type: "string",
    },
    owner: {
        alias: "o",
        describe: "The name of the user or organization",
        type: "string",
    },
    owners: {
        describe: "Multiple owners.",
        type: "array",
        conflicts: ["owner", "repo"],
    },
    repo: {
        alias: "r",
        describe: "The name of the repository to apply the label template to",
        type: "string",
        conflicts: "owners",
    },
    endpoint: {
        alias: "e",
        describe: "API endpoint to use",
        type: "string",
    },
    "dry-run": {
        alias: "d",
        describe: "Print what the program would do without actually doing it",
        type: "boolean",
    },
    "no-create": {
        describe: "Do not create labels missing from the repo but present in the file.",
        type: "boolean",
        default: false,
    },
    "no-delete": {
        describe: "Do not delete labels present from the repo but missing in the file.",
        type: "boolean",
        default: false,
    },
};

function promiseAll(labels, promisorFunc, logName, opts, repoUrl) {
    return Promise.all(_.map((label) => {
        if (opts["dry-run"]) {
            return Promise.resolve(`[DRY RUN] ${logName} ${label.name}: ${label.color}`);
        }
        return promisorFunc(label, repoUrl)
            .then(() => `${logName} ${label.name}: ${label.color}`)
            .catch(e => e);
    })(labels));
}

function createLabels(client, opts, existing, labels, repoUrl) {
    if (!opts["no-create"]) {
        const newLabels = _.differenceBy("name")(labels, existing);
        return promiseAll(newLabels, client.createLabel, "CREATE", opts, repoUrl);
    }
    return Promise.resolve([]);
}

function hasIncomingLabelChange({ name, color }) {
    return newLabel => name === newLabel.name
      && String(newLabel.color) !== String(color);
}

function getChangedLabels(labels) {
    return (el) => {
        const { color } = _.find(hasIncomingLabelChange)(labels);
        if (color) {
            return Object.assign({}, el, {
                color: String(color),
            });
        }
        return null;
    };
}

function updateLabels(client, opts, existing, labels) {
    if (!opts["no-create"]) {
        const changedLabels = _.compact(_.map(getChangedLabels(labels))(existing));
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
        deleteLabels(client, opts, existingLabels, labels),
    ]).then((repoResult) => {
        let output = _.flatten(repoResult);
        if (output.length === 1) {
            output = output.concat(["NO CHANGES"]);
        }
        return output;
    });
}


function main(args) {
    const opts = yargs.options(yargOpts).demandOption(["file", "token"]).parse(args);
    if (!_.has("owner")(opts) && !_.has("owners")(opts)) {
        yargs.showHelp();
        console.error("Must provide one of: owner, owners");
        process.exit();
    }
    const { file, token, endpoint } = opts;
    const labels = labelFile.read(file);
    const client = new Client(token, endpoint === undefined ? "https://api.github.com" : `${endpoint}/v3/api/`);

    const processWithExisting = repo => existingLabels => processRepo(
        client, opts, repo, labels, existingLabels,
    );

    const listLabels = thenFn => repo => client.listLabels(repo.url).then(thenFn(repo));
    const resolveRepo = thenFn => repo => Promise.resolve(repo).then(thenFn);
    const getAndFlatten = (procStep1, procStep2, procStep3) => repoList => Promise.all(
        repoList.map(procStep1(procStep2(procStep3))),
    ).then(_.flatten);

    new Promise((resolve) => {
        if (opts.owner !== undefined && opts.repo !== undefined) {
            resolve([client.getRepo(opts.owner, opts.repo)]);
        } else if (_.has("owner")(opts)) {
            resolve(client.listRepos(opts.owner));
        }
        resolve(Promise.all(opts.owners.map(owner => client.listRepos(owner))).then(_.flatten));
    }).then(getAndFlatten(resolveRepo, listLabels, processWithExisting))
        .then((results) => {
            console.log(results.join("\n"));
        }).catch((error) => {
            console.error(`gh-label failed: ${error}`);
            console.error(JSON.stringify(error));
        });
}

module.exports.main = main;

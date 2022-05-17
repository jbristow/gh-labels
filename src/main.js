const yargs = require("yargs");
const _ = require("lodash/fp");

const Client = require("./client");
const labelFile = require("./label_file");

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

async function promiseAll(labels, promisorFunc, logName, opts, repoUrl) {
    return Promise.all(_.map(async (label) => {
        if (opts["dry-run"]) {
            return `[DRY RUN] ${logName} ${label.name}: ${label.color}`;
        }
        await promisorFunc(label, repoUrl);
        return `${logName} ${label.name}: ${label.color}`;
    })(labels));
}

async function createLabels(client, opts, existing, labels, repoUrl) {
    if (!opts["no-create"]) {
        const newLabels = _.differenceBy("name")(labels, existing);
        return promiseAll(newLabels, (label) => client.createLabel(label), "CREATE", opts, repoUrl);
    }
    return [];
}

function hasIncomingLabelChange({
    name,
    color,
}) {
    return (newLabel) => name === newLabel.name
        && String(newLabel.color) !== String(color);
}

function getChangedLabels(labels) {
    return (el) => {
        const label = _.find(hasIncomingLabelChange(el))(labels);
        if (!label) {
            return null;
        }
        const { color } = label;
        if (color) {
            const retVal = { ...el };
            retVal.color = String(color);
            return retVal;
        }
        return null;
    };
}

async function updateLabels(client, opts, existing, labels) {
    if (!opts["no-create"]) {
        const changedLabels = _.compact(_.map(getChangedLabels(labels))(existing));
        return promiseAll(
            changedLabels,
            (label) => client.updateLabel(label),
            "UPDATE",
            opts,
        );
    }
    return [];
}

async function deleteLabels(client, opts, existing, labels) {
    if (!opts["no-delete"]) {
        const labelsToDelete = _.differenceBy("name")(existing, labels);
        return promiseAll(
            labelsToDelete,
            (label) => client.deleteLabel(label),
            "DELETE",
            opts,
        );
    }
    return [];
}

async function processRepo(client, opts, repo, labels, existingLabels) {
    const repoResult = await Promise.all([
        repo.full_name,
        createLabels(client, opts, existingLabels, labels, repo.url),
        updateLabels(client, opts, existingLabels, labels),
        deleteLabels(client, opts, existingLabels, labels),
    ]);

    let output = _.flatten(repoResult);
    if (output.length === 1) {
        output = output.concat(["NO CHANGES"]);
    }
    return output;
}

async function mainAsync(args) {
    const opts = yargs.options(yargOpts)
        .demandOption(["file", "token"])
        .parse(args);
    if (!_.has("owner")(opts) && !_.has("owners")(opts)) {
        yargs.showHelp();
        console.error("Must provide one of: owner, owners");
        process.exit();
    }
    const {
        file,
        token,
        endpoint,
    } = opts;
    const labels = labelFile.read(file);
    const baseURL = (endpoint === undefined || endpoint === "")
        ? "https://api.github.com"
        : `${endpoint}/v3/api/`;
    const client = new Client(token, baseURL);

    try {
        let repos;
        if (opts.owner !== undefined && opts.repo !== undefined) {
            repos = [await client.getRepo(opts.owner, opts.repo)];
        } else if (_.has("owner")(opts)) {
            repos = await client.listRepos(opts.owner);
        } else {
            const allRepos = Promise.all(opts.owners.map((owner) => client.listRepos(owner)));
            repos = _.flatten(await allRepos);
        }
        const results = await Promise.all(repos.map(async (repo) => {
            const existingLabels = await client.listLabels(repo.url);
            return processRepo(client, opts, repo, labels, existingLabels);
        }));
        console.log(_.flatten(results)
            .join("\n"));
    } catch (error) {
        console.error(`gh-label failed: ${error}`);
        console.error(error);
    }
}

function main() {
    mainAsync().then();
}

module.exports.main = main;

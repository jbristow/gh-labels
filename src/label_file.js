const yaml = require("js-yaml");
const fs = require("fs");
const _ = require("lodash/fp");

class LabelValidationError extends Error {
    constructor(label) {
        if (label !== undefined && _.has("color")(label)) {
            super(`label item without name. ${label.color}`);
        } else if (label !== undefined && _.has("name")(label)) {
            super(`label item without color. ${label.name}`);
        } else {
            super(`label item must have name and color: ${JSON.stringify(label)}`);
        }
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.label = label;
    }
}

function isInvalidLabel(label) {
    return label.name === undefined
      || label.name.trim() === ""
      || label.color === undefined
      || String(label.color).trim() === "";
}

function validateLabels(labels) {
    const badLabel = _.find(isInvalidLabel)(labels);
    if (badLabel) {
        throw new LabelValidationError(badLabel);
    }
}

function read(filename) {
    if (!fs.existsSync(filename)) {
        throw new Error(`file '${filename}' does not exist`);
    }

    let labels;
    try {
        labels = yaml.load(fs.readFileSync(filename, "utf8"));
    } catch (e) {
        throw new Error(`invalid yaml file '${filename}': ${e}`);
    }

    if (labels === undefined || labels.length === 0) {
        throw new Error(`no labels in ${filename}`);
    }

    validateLabels(labels);

    return labels;
}

module.exports.read = read;
module.exports.validateLabels = validateLabels;
module.exports.isInvalidLabel = isInvalidLabel;
module.exports.LabelValidationError = LabelValidationError;

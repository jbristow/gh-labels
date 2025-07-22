import {load as yamlLoad} from "js-yaml";
import fs from "fs";
import _ from "lodash/fp.js";

export class LabelValidationError extends Error {
    constructor(label) {
        if (label !== undefined && _.has("color")(label)) {
            super(`label item without name. ${label.color}`);
        } else if (label !== undefined && _.has("name")(label)) {
            super(`label item without color. ${label.name}`);
        } else {
            super(
                `label item must have name and color: ${JSON.stringify(label)}`,
            );
        }
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.label = label;
    }
}

export function isInvalidLabel(label) {
    return (
        label.name === undefined ||
        label.name.trim() === "" ||
        label.color === undefined ||
        String(label.color).trim() === ""
    );
}

export function validateLabels(labels) {
    const badLabel = _.find(isInvalidLabel)(labels);
    if (badLabel) {
        throw new LabelValidationError(badLabel);
    }
}

export function read(filename) {
    if (!fs.existsSync(filename)) {
        throw new Error(`file '${filename}' does not exist`);
    }

    let labels;
    try {
        labels = yamlLoad(fs.readFileSync(filename, "utf8"));
    } catch (e) {
        throw new Error(`invalid yaml file '${filename}': ${e}`);
    }

    if (labels === undefined || labels.length === 0) {
        throw new Error(`no labels in ${filename}`);
    }

    validateLabels(labels);

    return labels;
}

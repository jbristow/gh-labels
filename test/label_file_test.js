/* eslint-env mocha */
import { assert } from "chai";

import {
    isInvalidLabel,
    validateLabels,
    LabelValidationError,
} from "../src/label_file.js";

const goodSimple = { name: "label-name", color: "123456" };

const badNoName = { color: "123456" };
const badNoColor = { name: "label-name" };
const badEmptyColor = { name: "label-name", color: "" };
const badNoMatch = { other: "properties", irrelevant: true };

describe("labelFile", function () {
    describe("#isInvalidLabel()", function () {
        it("returns false for a good label", function () {
            assert.isFalse(isInvalidLabel(goodSimple));
        });

        it("returns false for a good label with too much info", function () {
            assert.isFalse(
                isInvalidLabel({
                    name: "label-name",
                    color: "123456",
                    extraneous: 1234,
                }),
            );
        });

        it("returns true when missing a name", function () {
            assert.isTrue(isInvalidLabel(badNoName));
        });

        it("returns true when missing a color", function () {
            assert.isTrue(isInvalidLabel(badNoColor));
        });

        it("returns true when color is empty", function () {
            assert.isTrue(isInvalidLabel(badEmptyColor));
        });

        it("returns true when no name and color", function () {
            assert.isTrue(isInvalidLabel(badNoMatch));
        });
    });

    describe("#validateLabels()", function () {
        it("is quiet for empty lists", function () {
            try {
                validateLabels([]);
            } catch (e) {
                assert.fail(null, null, `saw exception: ${e}`);
            }
        });

        it("is quiet for single good label", function () {
            try {
                validateLabels([{ name: "label-name", color: "123456" }]);
            } catch (e) {
                assert.fail(null, null, `saw exception: ${e}`);
            }
        });

        it("throws an error for a single bad label", function () {
            assert.throws(
                () => validateLabels([badNoName]),
                LabelValidationError,
            );
        });

        it("throws an error for a multiple bad labels", function () {
            assert.throws(
                () => validateLabels([badNoName, badNoColor]),
                LabelValidationError,
            );
        });

        it("throws an error for a multiple bad labels with good in front", function () {
            assert.throws(
                () => validateLabels([goodSimple, badNoName, badNoColor]),
                LabelValidationError,
            );
        });

        it("error contains only first error", function () {
            try {
                validateLabels([goodSimple, badNoName, badNoColor]);
            } catch (e) {
                assert.deepEqual(badNoName, e.label);
            }
        });
    });
});

/* eslint-env mocha */
const { assert } = require("chai");

const { isInvalidLabel, validateLabels, LabelValidationError } = require("../src/label_file.js");

const goodSimple = { name: "label-name", color: "123456" };

const badNoName = { color: "123456" };
const badNoColor = { name: "label-name" };
const badEmptyColor = { name: "label-name", color: "" };
const badNoMatch = { other: "properties", irrelevant: true };

describe("labelFile", () => {
    describe("#isInvalidLabel()", () => {
        it("returns false for a good label", () => {
            assert.isFalse(isInvalidLabel(goodSimple));
        });
        it("returns false for a good label with too much info", () => {
            assert.isFalse(isInvalidLabel({ name: "label-name", color: "123456", extraneous: 1234 }));
        });
        it("returns true when missing a name", () => {
            assert.isTrue(isInvalidLabel(badNoName));
        });
        it("returns true when missing a color", () => {
            assert.isTrue(isInvalidLabel(badNoColor));
        });
        it("returns true when color is empty", () => {
            assert.isTrue(isInvalidLabel(badEmptyColor));
        });
        it("returns true when no name and color", () => {
            assert.isTrue(isInvalidLabel(badNoMatch));
        });
    });
    describe("#validateLabels()", () => {
        it("is quiet for empty lists", () => {
            try {
                validateLabels([]);
            } catch (e) {
                assert.fail(null, null, `saw exception: ${e}`);
            }
        });
        it("is quiet for single good label", () => {
            try {
                validateLabels([{ name: "label-name", color: "123456" }]);
            } catch (e) {
                assert.fail(null, null, `saw exception: ${e}`);
            }
        });
        it("throws an error for a single bad label", () => {
            assert.throws(
                () => validateLabels([badNoName]),
                LabelValidationError,
            );
        });
        it("throws an error for a multiple bad labels", () => {
            assert.throws(
                () => validateLabels([badNoName, badNoColor]),
                LabelValidationError,
            );
        });
        it("throws an error for a multiple bad labels with good in front", () => {
            assert.throws(
                () => validateLabels([goodSimple, badNoName, badNoColor]),
                LabelValidationError,
            );
        });
        it("error contains only first error", () => {
            try {
                validateLabels([goodSimple, badNoName, badNoColor]);
            } catch (e) {
                assert.deepEqual(badNoName, e.label);
            }
        });
    });
});

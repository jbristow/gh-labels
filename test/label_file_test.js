const lf = require('../src/label_file.js');
const assert = require('chai').assert;

describe("labelFile", () => {
    const goodSimple = {name: "label-name", color: "123456"};

    const badNoName = {color: "123456"};
    const badNoColor = {name: "label-name"};
    const badEmptyColor = {name: "label-name", color:""};
    const badNoMatch= {other: "properties", irrelevant: true};

    describe("#isInvalidLabel()", () => {
        it("returns false for a good label", () => {
            assert.isFalse(lf.isInvalidLabel(goodSimple));
        });
        it("returns false for a good label with too much info", () => {
            assert.isFalse(lf.isInvalidLabel({name: "label-name", color: "123456", extraneous: 1234}));
        });
        it("returns true when missing a name", () => {
            assert.isTrue(lf.isInvalidLabel(badNoName));
        });
        it("returns true when missing a color", () => {
            assert.isTrue(lf.isInvalidLabel(badNoColor));
        });
        it("returns true when color is empty", () => {
            assert.isTrue(lf.isInvalidLabel(badEmptyColor));
        });
        it("returns true when no name and color", () => {
            assert.isTrue(lf.isInvalidLabel(badNoMatch));
        });
    });
    describe("#validateLabels()", () => {
        it("is quiet for empty lists", () => {
            try {
                lf.validateLabels([])
            } catch (e) {
                assert.fail(null,null,`saw exception: ${e}`);
            }
        });
        it("is quiet for single good label", () => {
            try {
                lf.validateLabels([{name:"label-name", color:"123456"}]);
            } catch (e) {
                assert.fail(null,null,`saw exception: ${e}`);
            }
        });
        it("throws an error for a single bad label", () => {
            assert.throws(() => lf.validateLabels([badNoName]),
                lf.LabelValidationError);
        });
        it("throws an error for a multiple bad labels", () => {
            assert.throws(() => lf.validateLabels([badNoName,badNoColor]),
                lf.LabelValidationError);
        });
        it("throws an error for a multiple bad labels with good in front", () => {
            assert.throws(() => lf.validateLabels([goodSimple,badNoName,badNoColor]),
                lf.LabelValidationError);
        });
        it("error contains only first error", () => {
            try {
            lf.validateLabels([goodSimple,badNoName,badNoColor])
            } catch (e) {
                assert.deepEqual(badNoName, e.label)
            }
        });
    });
});



const client = require("../src/client");
const assert = require("chai").assert;

describe("client", () => {
    describe("#defaultHeaders()", () => {
        it("adds the Accept and Authorization headers", () => {
            assert.hasAllKeys(client.defaultHeaders("test-token"), [ "Authorization", "Accept" ]);
        });
        it("adds the token to the Authorization header", () => {
            assert.equal(client.defaultHeaders("test-token").Authorization, "token test-token");
        });
    });
});

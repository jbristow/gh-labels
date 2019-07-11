/* eslint-env mocha */
const { expect } = require("chai");
const Client = require("../src/client");

const testClient = new Client("test-token", "test-url");

describe("client", () => {
    describe("#defaultHeaders()", () => {
        it("adds the Accept and Authorization headers", () => {
            expect(testClient.defaultHeaders())
                .to.include.all.keys(["Authorization", "Accept", "User-Agent"]);
        });
        it("adds the token to the Authorization header", () => {
            expect(testClient.defaultHeaders())
                .to.have.property("Authorization")
                .that.is.equal("token test-token");
        });
    });
});

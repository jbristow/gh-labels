/* eslint-env mocha */
import { expect } from "chai";
import Client from "../src/client.js";

const testClient = new Client("test-token", "test-url");

describe("client", function () {
    describe("#defaultHeaders()", function () {
        it("adds the Accept and Authorization headers", function () {
            expect(testClient.instance.defaults.headers).to.include.all.keys([
                "Authorization",
                "Accept",
                "User-Agent",
            ]);
        });

        it("adds the token to the Authorization header", function () {
            expect(testClient.instance.defaults.headers)
                .to.have.property("Authorization")
                .that.is.equal("token test-token");
        });
    });
});

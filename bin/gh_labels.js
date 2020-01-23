#!/usr/bin/env node

const main = require("../src/main.js");

try {
    main.main(process.argv);
} catch (error) {
    console.error(`gh-labels failed: ${error.message}`);
}

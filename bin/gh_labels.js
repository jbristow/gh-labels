#!/usr/bin/env node

try {
    require('../src/main.js')
        .main(process.argv);
} catch (error) {
    console.error(`gh-labels failed: ${error.message}`);
}

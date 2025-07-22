import js from "@eslint/js";
import chaiExpectPlugin from "eslint-plugin-chai-expect";
import mochaPlugin from "eslint-plugin-mocha";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import importPlugin from "eslint-plugin-import";

export default [
    js.configs.recommended,
    importPlugin.flatConfigs.recommended,
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                process: "readonly",
                module: "readonly",
                require: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
                console: "readonly",
            },
        },
        plugins: {
            js,
        },
    },
    mochaPlugin.configs.recommended,
    chaiExpectPlugin.configs["recommended-flat"],
    eslintConfigPrettier,
];

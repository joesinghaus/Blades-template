#!/usr/bin/env node

// Code below
const pug = require("pug"),
	fs = require("fs"),
	execSync = require("child_process").execSync,
	t0 = process.hrtime(),
	data = fs.readFileSync("Source/data.json", "utf8"),
	babel = require("jstransformer")(require("jstransformer-babel"));

const workerSource = `"use strict";
const data = ${data};
${fs.readFileSync("Source/sheetworkers.js", "utf8")}`;

const options = {
	data: JSON.parse(data),
	translation: JSON.parse(fs.readFileSync("translation.json", "utf8")),
	workers: babel.render(workerSource, {presets: ["minify"]}).body
};

// Build CSS file
const cssOutput = execSync("sass --no-source-map --style compressed Source/nocturne.scss").toString().replace(/^\uFEFF/, "");
fs.writeFileSync("nocturne.css", cssOutput);

// Build HTML
const htmlOutput = pug.renderFile("Source/nocturne.pug", options);
fs.writeFileSync("nocturne.html", `${htmlOutput}\n`);

console.log(`Sheet build completed. Time taken: ${(process.hrtime(t0)[0] + (process.hrtime(t0)[1] / 1e9)).toFixed(3)} s.`);

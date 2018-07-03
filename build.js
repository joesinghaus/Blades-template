#!/usr/bin/env node

// Code below
const pug = require("pug"),
	sass = require("node-sass"),
	fs = require("fs"),
	data = fs.readFileSync("Source/data.json", "utf8"),
	babel = require("jstransformer")(require("jstransformer-babel"));

const workerSource = `"use strict";const data = ${data};${
	fs.readFileSync("Source/sheetworkers.js", "utf8")
}`;



// Build CSS file
sass.render({
	file: "Source/nocturne.scss",
	outputStyle: "compressed",
}, (error, result) => {
	if (!error) {
		fs.writeFile("nocturne.css", result.css.toString("utf8").replace(/^\uFEFF/, ""), () => {});
	} else {
		console.log(`${error.line}:${error.column} ${error.message}.`);
	}
});

// Build HTML
const options = {
	data: JSON.parse(data),
	translation: JSON.parse(fs.readFileSync("translation.json", "utf8")),
	workers: babel.render(workerSource, {presets: ["minify"]}).body
};

const htmlOutput = pug.renderFile("Source/nocturne.pug", options);
fs.writeFile("nocturne.html", `${htmlOutput}\n`, () => {});

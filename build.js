#!/usr/bin/env node

// Code below
const pug = require('pug'),
	fs = require('fs'),
	execSync = require('child_process').execSync,
	t0 = process.hrtime(),
	data = fs.readFileSync('Source/data.json', 'utf8');

const options = {
	data: JSON.parse(data),
	translation: JSON.parse(fs.readFileSync('translation.json', 'utf8')),
	workers: `\n"use strict";\n` +
		`const data = ${data.trim()};\n` +
		`${fs.readFileSync('Source/sheetworkers.js', 'utf8').trim()}\n`
};

try {
	const babel = require('jstransformer')(require('jstransformer-babel'));
	options.workers = babel.render(options.workers, {presets: ['minify']}).body;
} catch (err) {
	console.log('jstransformer or jstransformer-babel did not execute successfully. Proceeding without minifying sheet workers. Error message was:');
	console.log(err);
}

// Build CSS file
const sassopts = `--no-source-map --style compressed`,
	cssOutput = execSync(`sass ${sassopts} Source/nocturne.scss`, {encoding: 'utf8'}).replace(/^@charset "UTF-8";\s*/, '');
fs.writeFileSync('nocturne.css', cssOutput);

// Build HTML
const htmlOutput = pug.renderFile('Source/nocturne.pug', options).trim().replace(/\n+/g, '\n');
fs.writeFileSync('nocturne.html', `${htmlOutput}\n`);

console.log(`Sheet build completed. Time taken: ${(process.hrtime(t0)[0] + (process.hrtime(t0)[1] / 1e9)).toFixed(3)} s.`);

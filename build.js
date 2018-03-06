#!/usr/bin/env node
// Configuration
const config = {
	enableBabel: true, // change to false to disable babel
	pretty: false // change to true if you want to produce human-readable output
};

// Code below
const pug = require('pug'),
	fs = require('fs'),
	execSync = require('child_process').execSync;

const options = {
	data: JSON.parse(fs.readFileSync('Source/data.json', 'utf8')),
	pretty: config.pretty,
	translation: JSON.parse(fs.readFileSync('translation.json', 'utf8')),
	workers: `\n"use strict";\n` +
		`const data=${fs.readFileSync('Source/data.json', 'utf8').replace(/\n$/, '')};\n` +
		`${fs.readFileSync('Source/sheetworkers.js', 'utf8').replace(/\n$/, '')}\n`
};

// Handle presence/absence of babel
if (config.enableBabel && !config.pretty) {
	try {
		const babel = require('jstransformer')(require('jstransformer-babel'));
		options.workers = `\n${babel.render(options.workers, {presets: ['minify']}).body}\n`;
	} catch (err) {
		console.log('jstransformer or jstransformer-babel not found. Proceeding without minifying sheet workers.');
	}
}

// Build CSS file
execSync('scss --default-encoding=UTF-8 --unix-newlines --sourcemap=none --no-cache --style '+ (config.pretty ? 'expanded' : 'compressed') + ' Source/blades.scss blades.css');
// repair bogus @charset directive
fs.writeFileSync('blades.css', fs.readFileSync('blades.css', 'utf8').replace(/^@charset "UTF-8";(?:\n|\r\n)?/, ''));

// Build HTML
const htmlOutput = pug.renderFile('Source/Blades.pug', options).replace(/\n\n/g, '\n').replace(/^\n/g, '');
fs.writeFileSync('blades.html', htmlOutput);

console.log('Sheet build completed.');

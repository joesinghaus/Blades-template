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

const enableBabel = config.enableBabel,
	options = {
		data: JSON.parse(fs.readFileSync('Source/data.json', 'utf8')),
		pretty: config.pretty,
		translation: JSON.parse(fs.readFileSync('translation.json', 'utf8'))
	},
	workerSrc = `\n"use strict";\n` +
		`const data=${fs.readFileSync('Source/data.json', 'utf8')};` +
		fs.readFileSync('Source/sheetworkers.js', 'utf8');

// Handle presence/absence of babel
if (enableBabel && !options.pretty) {
	const babel = require('jstransformer')(require('jstransformer-babel'));
	options.workers = '\n' + babel.render(workerSrc, {presets: ['minify']}).body + '\n';
}
else {
	options.workers = workerSrc;
}

// Build CSS file
execSync('scss --default-encoding=UTF-8 --sourcemap=none --no-cache --style '+ (options.pretty ? 'expanded' : 'compressed') + ' Source/blades.scss blades.css');
// repair bogus @charset directive
if (options.pretty) fs.writeFileSync('blades.css', fs.readFileSync('blades.css', 'utf8').replace('@charset "UTF-8";\n', ''));

// Build HTML
fs.writeFileSync('blades.html', pug.renderFile('Source/Blades.pug', options));

console.log('Sheet build completed');

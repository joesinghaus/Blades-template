#!/usr/bin/env node
const pug = require('pug'),
	fs = require('fs'),
	execSync = require('child_process').execSync;

const options = {
	data: JSON.parse(fs.readFileSync('Source/data.json', 'utf8')),
	translation: JSON.parse(fs.readFileSync('translation.json', 'utf8'))
};

// Build CSS file
execSync('scss --sourcemap=none --no-cache --style compressed Source/blades.scss blades.css');

// Build HTML
fs.writeFileSync('blades.html', pug.renderFile('Source/Blades.pug', options));

console.log('Sheet build completed');

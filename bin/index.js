#! /usr/bin/env node

const { Command } = require('commander');
const { setToken, newScript } = require('./utils');
const HtmlUploader = require('./htmlu');
const Script = require('./script');
const { resolve } = require('path');

const program = new Command();

program
  .option('-p, --production', 'Run in production mode', false)
  .option('-t, --html', 'Deploy Web Files')
  .option('-t, --token <token>', 'Set the token')
  .option('-n, --new <script>', 'Create a new script');

program.parse(process.argv);

const options = program.opts();

if (options.html) {
  require('dotenv').config({ path: resolve(__dirname, '../.env') });
  return new HtmlUploader(options.production);
}

if (options.token) {
  return setToken(options.token);
}

if (options.new) {
  return newScript(options.new);
}

new Script(options.production);

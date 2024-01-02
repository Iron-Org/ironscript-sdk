const { writeFileSync, mkdirSync, existsSync } = require('fs');
const { join } = require('path');
const { Signale } = require('signale');

const setToken = token => {
  writeFileSync(__dirname + '/.token', token);
  const signale = new Signale();
  signale.success('Token setted!');
};

const newScript = name => {
  const directory = process.cwd();
  const resolved = join(directory, name);

  if (!existsSync(resolved)) {
    mkdirSync(resolved);  
  }

  writeFileSync(join(resolved, 'index.js'), '');
  writeFileSync(join(resolved, 'config.json'), '{ "roomid": 0, "folder": "" }');

  const signale = new Signale();
  signale.success('New script created!');
};

module.exports = { setToken, newScript };
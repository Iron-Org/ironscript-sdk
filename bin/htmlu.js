const { existsSync, readFileSync, writeFileSync, unlinkSync, unlink } = require('fs');
const { join } = require('path');
const { Signale } = require('signale');
const cheerio = require('cheerio');
const SFTPClient = require('ssh2-sftp-client');
const UglifyJS = require('uglify-js');

class HtmlUploader {
  constructor (production = false) {
    this.production = production;
    this.url = 'https://scriptcdn.ironhotel.org';
    this.directory = process.cwd();
    this.directoryFolder = this.directory + '/html';
    this.config = this.getFile(this.directory, 'config.json');
    this.exec();
  }

  exec () {
    const signale = new Signale();
    const code = this.getFile(this.directoryFolder, 'index.html', true);
    const html = this.parseHtml(code);

    this.genTemporaryFiles(html);
    this.deploy()
      .then(() => signale.success('Web Files Uploaded!'))
      .catch(err => signale.error(`Upload Failed! ${err}`));
  }

  increaseNumber (text) {
    const current = parseInt(text.match(/(v=)(\d+)/)[2]);
    return text.replace(/(v=)\d+/, `$1${current + 1}`)
  }

  parseHtml (document) {
    const $ = cheerio.load(document);

    const src = $('.ironscript-script').attr('src');
    const href = $('.ironscript-css').attr('href');

    $('.ironscript-script').attr('src', this.increaseNumber(src));
    $('.ironscript-css').attr('href', this.increaseNumber(href));

    const htmlContent = $('body').html()
    return `<body>${htmlContent}</body>`;
  }

  genTemporaryFiles (text) {
    writeFileSync(this.directoryFolder + '/temp.html', text);

    if (this.production) {
      const code = this.getFile(this.directoryFolder, 'script.js', true);
      const minified = UglifyJS.minify(code);

      if (minified.error) {
        throw new Error('Erro durante a minificação: \n' + minified.error);
      } else {
        writeFileSync(this.directoryFolder + '/temp.js', minified.code);
      }
    }

    return true
  }

  deleteTemporaryFiles () {
    try {
      unlinkSync(this.directoryFolder + '/temp.html');
      
      if (this.production) {
        unlinkSync(this.directoryFolder + '/temp.js');
      }
    } catch (e) {
      const signale = new Signale();
      signale.error('Failed on try delete temporary file!');
    }
  }

  async deploy () {
    const sftp = new SFTPClient();
    const jsFile = this.production ? '/temp.js' : '/script.js';
    const config = {
      host: process.env.CDN_IP,
      port: process.env.PORT,
      username: process.env.USER,
      password: process.env.PASSWORD
    }

    await sftp.connect(config)

    const remoteDir = `/var/www/html/${this.config.folder}`
    const existsDir = await sftp.exists(remoteDir)

    if (!existsDir) {
      await sftp.mkdir(remoteDir, true);
    }

    await sftp.put(this.directoryFolder + '/temp.html', `${remoteDir}/index.html`);

    if (existsSync(this.directoryFolder + '/style.css')) {
      await sftp.put(this.directoryFolder + '/style.css', `${remoteDir}/style.css`);
    }

    if (existsSync(this.directoryFolder + jsFile)) {
      await sftp.put(this.directoryFolder + jsFile, `${remoteDir}/script.js`);
    }

    this.deleteTemporaryFiles();
    return sftp.end();
  }

  getFile (directory, file, read) {
    const dir = join(directory, file);

    if (!existsSync(dir)) {
      const err = new Error(`Missing ${file}!`);
      throw err;
    }

    if (!read) {
      return require(dir);
    }

    return readFileSync(dir, 'utf-8');
  }
}

module.exports = HtmlUploader

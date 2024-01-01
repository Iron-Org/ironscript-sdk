const { rollup } = require('rollup')
const terser = require('@rollup/plugin-terser')
const { existsSync, readFileSync } = require('fs')
const { join } = require('path')
const { Signale } = require('signale');
const axios = require('axios')

class Script {
  constructor (production = false) {
    this.production = production
    this.url = 'https://ironhotel.org'
    this.directory = process.cwd()
    this.config = this.getFile(this.directory, 'config.json')
    this.token = this.getFile(__dirname, '.token', true)
    this.exec()
  }

  exec () {
    const signale = new Signale();
    this.getScript()
      .then(this.deploy.bind(this))
      .then(() => signale.success('Code Deployed!'))
      .catch(err => signale.error(`Deploy Failed! ${err}`))
  }

  deploy (script) {
    const roomid = this.config.roomid
    const url = `${this.url}/scriptApi.php?roomid=${roomid}`
    const options = {
      method: 'GET',
      headers: { 'token': this.token },
      data: script,
      url,
    }

    return axios(options)
  }

  async getScript () {
    const file = 'index.js'
    const input = await rollup({ input: file })
    const config = this.getOutputConfig()
    const output = await input.generate(config)
    const script = output?.output[0]
    return script?.code
  }

  getOutputConfig () {
    const config = {
      format: 'cjs',
      file: 'script.js'
    }

    if (this.production) {
      const options = {
        toplevel: false,
        mangle: false,
        compress: false
      }
      config.plugins = [terser(options)]
    }

    return config
  }

  getFile (directory, file, read) {
    const dir = join(directory, file)

    if (!existsSync(dir)) {
      const err = new Error(`Missing ${file}!`)
      throw err
    }

    if (!read) {
      return require(dir)
    }

    return readFileSync(dir, 'utf-8')
  }
}

module.exports = Script

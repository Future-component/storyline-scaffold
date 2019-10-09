const fs = require('fs')
const path = require('path')
// const args = require('yargs').argv
const Consul = require('zhike-consul')
const glob = require('glob')
const co = require('co')
const OSS = require('ali-oss')
const chalkConfig = require('./chalkConfig')
const chalkSuccess = chalkConfig.chalkSuccess
const chalkError = chalkConfig.chalkError
// const chalkWarning = chalkConfig.chalkWarning
const chalkProcessing = chalkConfig.chalkProcessing
const config = require('../src/config.json')

// const isAll = args.all

function readConfigFile(fp) {
  try {
    fs.accessSync(fp)
    const config = require(fp)
    return config
  } catch (err) {
    return
  }
}

co(function* uploadFiles() {
  let ossConfig = require('../src/config.json').oss

  if (!ossConfig) {
    const consulConfig = readConfigFile(path.join(__dirname, '../consul.config.json'))
    if (!consulConfig) {
      console.log(chalkError('please create consul.config.json'))
      process.exit()
    }

    const consul = new Consul(consulConfig.keys, consulConfig.host, consulConfig.port, global)

    console.log(chalkSuccess(`Loading oss config from consul::${consulConfig.host}:${consulConfig.port}`)) // eslint-disable-line no-console
    const data = yield consul.pull(consulConfig.env)
    ossConfig = data.config.oss
  }

  const client = new OSS({
    accessKeyId: ossConfig.key,
    accessKeySecret: ossConfig.secret,
    endpoint: ossConfig.endpoint,
    bucket: ossConfig.uskidbucket,
  })

  const files = glob.sync('**/*', {
    cwd: path.join(__dirname, '../build'),
    nodir: true,
    dot: true,
    ignore: '*index.html',
  })

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i]
    const key = `${config.uploadDir}/class/${file}`
    console.log('key:====', key)
    yield client.put(key, path.join(__dirname, '../build', file))
    console.log(chalkProcessing(`file key: ${key}`)) // eslint-disable-line no-console
    console.log(chalkProcessing(`file uploaded: ${file}`)) // eslint-disable-line no-console
  }
  console.log(chalkSuccess('Done!')) // eslint-disable-line no-console
}).catch((err) => {
  console.log(chalkError(err)) // eslint-disable-line no-console
})

require('babel-register');
const fs = require('fs');
const path = require('path');
const Consul = require('zhike-consul');
const assgin = require('lodash/assign');
const chalkConfig = require('./chalkConfig');
const chalkSuccess = chalkConfig.chalkSuccess;
const chalkError = chalkConfig.chalkError;
const chalkWarning = chalkConfig.chalkWarning;

// fs.existsSync is deprecated
function readConfigFile(fp) {
  try {
    fs.accessSync(fp);
    const config = require(fp); // eslint-disable-line
    return config;
  } catch (err) {
    return undefined;
  }
}

// 默认规则，连接失败则创建默认配置
function getConfig(consulData) {
  const port = 20000;
  // consulData contains some
  const defaultConfig = {
    port,
    api: {
      uskid: 'http://localhost:3000',
    },
    STATIC_PREFIX: `http://localhost:${port}/`,
  };
  if (!consulData) {
    return defaultConfig;
  }
  return assgin({}, defaultConfig, consulData);
}

function generateConfig(config) {
  console.log(chalkSuccess("configuration file is generated in config.json. It's ready to roll!")); // eslint-disable-line no-console
  fs.writeFileSync(path.join(__dirname, '../src/config.json'), JSON.stringify(config, (key, value) => value, '  '));
  process.exit();
}

function generateDefaultConfig() {
  console.log(chalkWarning('Generating a default config.json')); // eslint-disable-line no-console
  const config = getConfig();
  generateConfig(config);
}

const consulConfig = readConfigFile(path.join(__dirname, '../consul.config.json'));

if (!consulConfig) {
  generateDefaultConfig();
}
const consul = new Consul(consulConfig.keys, consulConfig.host, consulConfig.port, global);
// console.log(consul, '***');
console.log(chalkSuccess(`Generating config.json from consul::${consulConfig.host}:${consulConfig.port}`)); // eslint-disable-line no-console
consul.pull(consulConfig.env).then((data) => {
  const config = getConfig(data.config);
  generateConfig(config);
}).catch((e) => {
  console.log(chalkError('ERROR', e.message)); // eslint-disable-line no-console
  generateDefaultConfig();
  // throw e;
});

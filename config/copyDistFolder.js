const fs = require('fs-extra')
const path = require('path')
const config = require('../config.local')

function copyDistFolder() {
  fs.copySync(
    path.resolve(__dirname, '../dist/'),
    path.resolve(__dirname, `../build/`),
    {
      dereference: true,
    }
  )
}

copyDistFolder()

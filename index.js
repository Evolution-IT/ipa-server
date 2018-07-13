const router = require('koa-route')
const serve = require('koa-static')
const Koa = require('koa')
const app = new Koa()
const config = require('./config')
const { createPlistBody } = require('./libs/plist')
const ipaManager = require('./libs/ipa-manager')
const upload = require('./middle/upload')
const locale = require('koa-locale')
const moment = require('moment')
const path = require('path')
const publicURL = require('./libs/public-url')
const https = require('https')
const fs = require('fs')


// locale
locale(app)
app.use(async (ctx, next) => {
  // set moment language
  moment.locale(ctx.getLocaleFromCookie())
  await next()
})

// static files
app.use(serve(path.join(__dirname, 'public'), {defer: true}))
app.use(serve(config.uploadDir, {maxage: 1000 * 3600 * 24 * 365, defer: true}))

// get app list
app.use(router.get('/api/list', async ctx => {
  ctx.body = ipaManager.list(publicURL(ctx))
}))

app.use(router.get('/api/info/:id', async (ctx, id) => {
  ctx.body = ipaManager.find(id, publicURL(ctx))
}))

// import ipa
app.use(router.post('/api/upload', upload({
  defExt: 'ipa',
}, async (ctx, files) => {
  try {
    await ipaManager.add(files[0])
    ctx.body = { meg: 'Upload Done' }
  } catch (err) {
    console.error('Upload fail:', err)
    ctx.body = { err: 'Upload fail' }
  }
})))

// get install plist
app.use(router.get('/plist/:id.plist', async (ctx, id) => {
  const info = ipaManager.find(id, publicURL(ctx))
  ctx.set('Content-Disposition', `attachment; filename=${encodeURI(info.identifier)}.plist`)
  ctx.body = createPlistBody(info)
}))

// catch crash
app.on('error', err => {
  console.error('*** SERVER ERROR ***\n', err)
  err.status !== 400 && config.debug && require('child_process').spawn('say', ['oh my god, crash!'])
})

// start service
app.listen(config.port, config.host, ()=>{
  console.log(`Server started: http://${config.host}:${config.port}`)
})

if (config.useHTTPS) {

  const options = {
    key: fs.readFileSync(`${config.certLocation}/certificate.key`),
    cert: fs.readFileSync(`${config.certLocation}/certificate.pem`),
  }

  https.createServer(options, app.callback()).listen(config.port + 1);
}

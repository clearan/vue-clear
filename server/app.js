const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const logger = require('koa-logger')

const index = require('./routes/index')
const koaBody=require("koa-body")
const cors = require('koa2-cors')
// error handler
onerror(app)
app.use(cors({
  origin: function (ctx) {
    // return 'http://localhost:8081'
    return '*'
  }
}))
// middlewares
app.use(koaBody({
  multipart: true,
  formidable: {
    maxFileSize: 600*1024*1024,    // 设置上传文件大小最大限制，默认2M
    // multipart: true,
  }
}));
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
app.use(index.routes(), index.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app

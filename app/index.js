const Koa = require('koa');
const KoaBody = require('koa-body')
const KoaStatic = require('koa-static')
const error = require('koa-json-error')
const parameter = require('koa-parameter')
const mongoose = require('mongoose')
const app = new Koa();
const routing = require('./routes')
const {connectionStr} = require('./config')
const path = require('path')

mongoose.connect(connectionStr,{ 
    useUnifiedTopology: true,
    useNewUrlParser: true 
}, ()=>console.log('MongoDB 连接成功了！'))

mongoose.connection.on('error',console.error)


app.use(KoaStatic(path.join(__dirname,'public')))

app.use(error({
    postFormat: (e,{stack,...rest}) => process.env.NODE_ENV === 'production' ? rest : {stack,...rest}
}))

app.use(KoaBody({
    multipart: true,
    formidable: {
        uploadDir: path.join(__dirname,'/public/uploads'),
        keepExtensions: true
    }
}))

app.use(parameter(app))
routing(app)

app.listen(4000, () => console.log('程序启动在 4000 端口了'))

const fs = require('fs')
module.exports = (app) => {
    fs.readdirSync(__dirname).forEach(file => {
        if (file === 'index.js' || file.charAt(0)==='.') {
            return
        }
        const route = require(`./${file}`)
        console.log(route.routes)
        app.use(route.routes()).use(route.allowedMethods())
    })
}

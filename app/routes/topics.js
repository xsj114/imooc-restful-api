// const jsonwebtoken = require('jsonwebtoken')
const jwt = require('koa-jwt')
const Router = require('koa-router')
const router = new Router({prefix: '/topics'})
const {
    find,
    findById,
    create,
    update,
    checkTopicExist,
    listFollowers,
    listQuestions
} = require('../controllers/topics')

const {secret} = require('../config')

// const auth = async (ctx,next) => {

//     const {authorization = ''} =  ctx.request.header
//     const token = authorization.replace('Bearer ','') 
//     try{
//         const user = jsonwebtoken.verify(token,secret)
//         ctx.state.user = user
//     } catch(err) {
//         ctx.throw(401,err.message)
//     }
//     await next()
// }

const auth = jwt({secret})

router.get('/', find)
router.post('/', auth, create)
router.get('/:id', checkTopicExist,findById)
router.patch('/:id',auth,checkTopicExist, update)
router.get('/:id/followers',checkTopicExist,listFollowers )
router.get('/:id/questions',checkTopicExist,listQuestions )

module.exports = router

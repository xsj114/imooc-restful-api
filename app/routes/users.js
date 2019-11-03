// const jsonwebtoken = require('jsonwebtoken')
const jwt = require('koa-jwt')
const Router = require('koa-router')
const router = new Router({prefix: '/users'})
const {
    find,
    findById,
    create,
    update,
    delete:del,
    login,
    checkOwner,
    listFollowing,
    checkUserExist,
    follow,
    unfollow,
    listFollowers,
    listFollowingTopics,
    followTopic,
    unfollowTopic,
    listQuestions,
    listLikingAnswers,
    likeAnswer,
    unlikeAnswer,
    listDisLikingAnswers,
    dislikeAnswer,
    undislikeAnswer,
    listCollectingAnswers,
    collectAnswer,
    uncollectAnswer
} = require('../controllers/users')

const {checkTopicExist} = require('../controllers/topics')
const {checkAnswerExist} = require('../controllers/answers')

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
router.post('/',create)
router.get('/:id', findById)
router.patch('/:id',auth,checkOwner, update)
router.delete('/:id',auth,checkOwner, del)
router.post('/login',login)
router.get('/:id/following',listFollowing)
router.get('/:id/followers',listFollowers)
router.put('/following/:id',auth,checkUserExist,follow)
router.delete('/following/:id',auth,checkUserExist,unfollow)
router.get('/:id/followingTopics',listFollowingTopics)
router.put('/followingTopics/:id',auth, checkTopicExist, followTopic)
router.delete('/followingTopics/:id',auth,checkTopicExist,unfollowTopic)
router.get('/:id/questions',listQuestions)
router.get('/:id/likingAnswers',listLikingAnswers)
router.put('/likingAnswers/:id',auth, checkAnswerExist, likeAnswer, undislikeAnswer)
router.delete('/likingAnswers/:id',auth,checkAnswerExist,unlikeAnswer)
router.get('/:id/dislikingAnswers',listDisLikingAnswers)
router.put('/dislikingAnswers/:id',auth, checkAnswerExist, dislikeAnswer,unlikeAnswer)
router.delete('/dislikingAnswers/:id',auth,checkAnswerExist,undislikeAnswer)
router.get('/:id/collectingAnswers',listCollectingAnswers)
router.put('/collectingAnswers/:id',auth, checkAnswerExist, collectAnswer)
router.delete('/collectingAnswers/:id',auth,checkAnswerExist,uncollectAnswer)

module.exports = router


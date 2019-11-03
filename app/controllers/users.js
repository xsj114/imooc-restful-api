const jsonwebtoken = require('jsonwebtoken')
const User = require('../models/users')
const Question = require('../models/questions')
const Answer = require('../models/answers')
const {secret} = require('../config')

class UserCtl {

    async find (ctx) {
        // 查询用户列表
        // ctx.set('Allow','GET, POST')
        const {per_page = 10} = ctx.query
        const page = Math.max(ctx.query.page * 1,1) -1
        const perPage = Math.max(per_page * 1, 1)
        ctx.body = await User.find({name: new RegExp(ctx.query.q)}).limit(perPage).skip(page * perPage)
    }

    async findById (ctx) {
        // 查询特定用户
        const {fields = ''} = ctx.query
        const selectFields = fields.split(';').filter(f => f).map(f=>' +'+f).join('')
        const populateStr = fields.split(';').filter(f => f).map(f => {
            if (f === 'employments') {
                return 'employments.company employments.job'
            }
            if (f === 'educations') {
                return 'employments.school employments.major'
            }
            return f
        }).join(' ')
        const user = await User.findById(ctx.params.id).select(selectFields).populate(populateStr)
        if (!user) {
            ctx.throw(404,'用户不存在')
        }
        ctx.body = user
    }

    async create (ctx) {
        // 新增用户
        ctx.verifyParams({
            name: {type: 'string',required: true},
            password: {type: 'string', required: true}
        })
        const {name} = ctx.request.body
        const repeatedUser = await User.findOne({name})
        if (repeatedUser) {
            ctx.throw(409,'用户已经占用')
        }
        const user = await new User(ctx.request.body).save()
        ctx.body = user
    }

    async checkOwner(ctx,next) {
        // 验证是不是自己
        if (ctx.params.id !== ctx.state.user._id) {
            ctx.throw(403,'没有权限')
        }
        await next()
    }

    async update (ctx) {
        // 更新用户
        ctx.verifyParams({
            name: {type: 'string',required: false},
            password: {type: 'string', required: false},
            avatar_url: {type: 'string',required: false},
            gender: {type:'string',required:false},
            headline: {type: 'string',required:false},
            locations: {type: 'array',itemType:'string',required: false},
            business: {type: 'string',required:false},
            employments: {type:'array',itemType:'object',required:false},
            educations: {type:'array',itemType:'object',required:false}
        })
        const user = await User.findByIdAndUpdate(ctx.params.id,ctx.request.body)
        if (!user) {
            ctx.throw(404,'用户不存在')
        }
        ctx.body = user
    }

    async delete (ctx) {
        // 删除用户
        const user = await User.findByIdAndRemove(ctx.params.id)
        if (!user) {ctx.throw(404,'用户不存在')}
        ctx.status = 204
    }

    async login (ctx) {
        // 登录
        ctx.verifyParams({
            name: {type:'string',required:true},
            password: {type:'string',required: true}
        })
        const user = await User.findOne(ctx.request.body)
        if (!user) {
            ctx.throw(401,'用户名或密码不正确')
        }
        const {_id,name} = user
        const token = jsonwebtoken.sign({_id,name},secret,{expiresIn:'1d'})
        ctx.body = {token}
    }

    async listFollowing (ctx) {
        // 获取关注人列表
        const user = await User.findById(ctx.params.id).select('+following').populate('following')
        if (!user) {ctx.throw(404,'用户不存在')}
        ctx.body = user.following
    }

    async listFollowers(ctx) {
        // 获取粉丝
        const users = await User.find({following: ctx.params.id})    
        ctx.body = users
    }
    
    async checkUserExist (ctx,next) {
        const user = await User.findById(ctx.params.id)
        if (!user) {
            ctx.throw(404,'用户不存在')
        }
        await next()
    }

    async follow (ctx) {
        // 关注
        const me = await User.findById(ctx.state.user._id).select('+following')
        if (!me.following.map(id=>id.toString()).includes(ctx.params.id)) {
            me.following.push(ctx.params.id)
            me.save()
        }
        ctx.status = 204
    }

    async unfollow (ctx) {
        // 取消关注
        const me = await User.findById(ctx.state.user._id).select('+following')
        const index = me.following.map(id=>id.toString()).indexOf(ctx.params.id)
        if (index > -1) {
            me.following.splice(index, 1)
            me.save()
        }
        ctx.status = 204
    }

    async listFollowingTopics (ctx) {
        // 获取关注话题列表
        const user = await User.findById(ctx.params.id).select('+followingTopics').populate('followingTopics')
        if (!user) {ctx.throw(404),'用户不存在'}
        ctx.body = user.followingTopics
    }
    
    async followTopic (ctx) {
        // 关注话题
        const me = await User.findById(ctx.state.user._id).select('+followingTopics')
        if (!me.followingTopics.map(id=>id.toString()).includes(ctx.params.id)) {
            me.followingTopics.push(ctx.params.id)
            me.save()
        }
        ctx.status = 204
    }

    async unfollowTopic (ctx) {
        // 取消关注话题
        const me = await User.findById(ctx.state.user._id).select('+followingTopics')
        const index = me.followingTopics.map(id=>id.toString()).indexOf(ctx.params.id)
        if (index > -1) {
            me.followingTopics.splice(index, 1)
            me.save()
        }
        ctx.status = 204
    }

    async listQuestions (ctx) {
        const questions = await Question.find({questioner: ctx.params.id})
        ctx.body = questions
    }


    async listLikingAnswers (ctx) {
        //赞的答案列表 
        const user = await User.findById(ctx.params.id).select('+likingAnswers').populate('likingAnswers')
        if (!user) {ctx.throw(404),'用户不存在'}
        ctx.body = user.likingAnswers
    }
    
    async likeAnswer (ctx,next) {
        // 赞
        const me = await User.findById(ctx.state.user._id).select('+likingAnswers')
        if (!me.likingAnswers.map(id=>id.toString()).includes(ctx.params.id)) {
            me.likingAnswers.push(ctx.params.id)
            me.save()
            await Answer.findByIdAndUpdate(ctx.params.id,{$inc:{voteCount: 1}})
        }
        ctx.status = 204
        await next()
    }

    async unlikeAnswer (ctx) {
        // 取消赞
        const me = await User.findById(ctx.state.user._id).select('+likingAnswers')
        const index = me.likingAnswers.map(id=>id.toString()).indexOf(ctx.params.id)
        if (index > -1) {
            me.likingAnswers.splice(index, 1)
            me.save()
            await Answer.findByIdAndUpdate(ctx.params.id,{$inc:{voteCount: -1}})
        }
        ctx.status = 204
    }

    async listDisLikingAnswers (ctx) {
        //踩的答案列表 
        const user = await User.findById(ctx.params.id).select('+dislikingAnswers').populate('dislikingAnswers')
        if (!user) {ctx.throw(404),'用户不存在'}
        ctx.body = user.dislikingAnswers
    }
    
    async dislikeAnswer (ctx,next) {
        // 踩 
        const me = await User.findById(ctx.state.user._id).select('+dislikingAnswers')
        if (!me.dislikingAnswers.map(id=>id.toString()).includes(ctx.params.id)) {
            me.dislikingAnswers.push(ctx.params.id)
            me.save()
        }
        ctx.status = 204
        await next()
    }

    async undislikeAnswer (ctx) {
        // 取消踩
        const me = await User.findById(ctx.state.user._id).select('+dislikingAnswers')
        const index = me.dislikingAnswers.map(id=>id.toString()).indexOf(ctx.params.id)
        if (index > -1) {
            me.dislikingAnswers.splice(index, 1)
            me.save()
        }
        ctx.status = 204
    }


    async listCollectingAnswers (ctx) {
        //收藏答案列表 
        const user = await User.findById(ctx.params.id).select('+collectingAnswers').populate('collectingAnswers')
        if (!user) {ctx.throw(404),'用户不存在'}
        ctx.body = user.collectingAnswers
    }
    
    async collectAnswer (ctx,next) {
        // 踩 
        const me = await User.findById(ctx.state.user._id).select('+collectingAnswers')
        if (!me.collectingAnswers.map(id=>id.toString()).includes(ctx.params.id)) {
            me.collectingAnswers.push(ctx.params.id)
            me.save()
        }
        ctx.status = 204
        await next()
    }

    async uncollectAnswer (ctx) {
        // 取消踩
        const me = await User.findById(ctx.state.user._id).select('+collectingAnswers')
        const index = me.collectingAnswers.map(id=>id.toString()).indexOf(ctx.params.id)
        if (index > -1) {
            me.collectingAnswers.splice(index, 1)
            me.save()
        }
        ctx.status = 204
    }
    

}


module.exports = new UserCtl()

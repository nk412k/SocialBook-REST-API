const User=require('../models/user');
const {validationResult}=require('express-validator');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');

exports.signup=(req,res,next)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        const err=new Error('Validation Error')
        err.data=errors.array();
        err.statusCode=422;
        throw err;
    }
    const email=req.body.email;
    const password=req.body.password;
    const name=req.body.name;
    bcrypt.hash(password,12)
    .then(hashpass=>{
        const user=new User({email:email,password:hashpass,name:name});
        return user.save();
    })
    .then(result=>{
        res.status(200).json({message:'User created',userId:result._id});
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
        }
        next(err);
    })
};

exports.login=(req,res,next)=>{
    const email=req.body.email;
    const password=req.body.password;
    let user;
    User.findOne({email:email})
    .then(userDoc=>{
        if(!userDoc){
            const error=new Error('User not found')
            error.statusCode=401;
            throw error;
        }
        user=userDoc;
        return bcrypt.compare(password,userDoc.password)
    })
    .then(isMatch=>{
        if(!isMatch){
            const error = new Error("Password does not match");
            error.statusCode = 401;
            throw error;
        }
        const token= jwt.sign({email:user.email,userId:user._id.toString()},'somesecret',{expiresIn:'1h'});
        res.status(200).json({token:token,userId:user._id.toString()});
    })
    .catch(err=>{
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
    })
}
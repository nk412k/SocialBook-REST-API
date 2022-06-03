const User=require('../models/user');
const {validationResult}=require('express-validator');

exports.getStatus=(req,res,next)=>{
    User.findById(req.userId)
    .then(user=>{
        if(!user){
            const error=new Error('User not found');
            error.statusCode=404;
            throw error;
        }
        res.status(200).json({status:user.status});
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode=500;
        }
        next(err);
    })
}

exports.postStatus=(req,res,next)=>{
    const newStatus=req.body.status;
    const error=validationResult(req);
    if(!error.isEmpty){
        const error = new Error("invalid status");
        error.statusCode = 404;
        throw error;
    }
    User.findById(req.userId)
      .then((user) => {
        if (!user) {
          const error = new Error("User not found");
          error.statusCode = 404;
          throw error;
        }
        user.status=newStatus;
        return user.save()
    })
    .then(result=>{
          res.status(200).json({message:'Status updated'});
    })
      .catch((err) => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });
}
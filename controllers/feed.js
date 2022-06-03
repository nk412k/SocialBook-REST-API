const { validationResult} = require("express-validator");
const Post = require("../models/post");
const fs = require("fs");
const path = require("path");
const User = require("../models/user");
const io=require('../socket');

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const postPerPage = 2;
  let totalposts;
  Post.find()
    .countDocuments()
    .then((count) => {
      totalposts = count;
      return Post.find().populate('creator')
        .skip((currentPage - 1) * postPerPage)
        .limit(postPerPage);
    })
    .then((posts) => {
      res
        .status(200)
        .json({
          posts: posts,
          totalItems: totalposts,
          message: "Fetched post successfully",
        });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.createPost = (req, res, next) => {
  const title = req.body.title;
  const content = req.body.content;
  const error = validationResult(req);
  if (!error.isEmpty()) {
    const error = new Error("validation failed, enter valid input");
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error("image not provided");
    error.statusCode = 404;
    throw error;
  }
  const image = req.file;
  const imageUrl = image.path.replace("\\", "/");
  const post = new Post({
    title: title,
    content: content,
    creator: req.userId,
    imageUrl: imageUrl,
  });
  let creator;
  post
    .save()
    .then((result) => {
      return User.findById(req.userId);
    })
    .then((user) => {
      creator = user;
      user.posts.push(post);
      return user.save();
    })
    .then((result) => {
      io.getIo().emit('posts',{ action: "created" ,post:{...post._doc,creator:{_id: creator._id, name: creator.name}}});
      res.status(201).json({
        message: "Post has been created",
        post: post,
        creator: { _id: creator._id, name: creator.name },
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getSinglePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ post: post });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.putUpdatePost = (req, res, next) => {
  const postId = req.params.postId;
  const error = validationResult(req);
  if (!error.isEmpty()) {
    const error = new Error("validation failed, enter valid input");
    error.statusCode = 422;
    throw error;
  }
  let imageUrl = req.body.image;
  const title = req.body.title;
  const content = req.body.content;
  if (req.file) {
    imageUrl = req.file.path.replace("\\", "/");
  }
  if (!imageUrl) {
    const error = new Error("image not provided");
    error.statusCode = 404;
    throw error;
  }
  Post.findById(postId).populate('creator')
    .then((post) => {
      if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        throw error;
      }
      if (post.creator._id.toString() != req.userId) {
        const err = new Error("Not authorized");
        err.statusCode = 401;
        throw err;
      }
      if (imageUrl !== post.imageUrl) {
        deleteImage(post.imageUrl);
      }
      post.title = title;
      post.imageUrl = imageUrl;
      post.content = content;
      return post.save();
    })
    .then((result) => {
      io.getIo().emit('posts',{action:'updated',post:result})
      res.status(200).json({ message: "post updated", post: result });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        throw error;
      }
      if (post.creator.toString() != req.userId.toString()) {
        const err = new Error("Not authorized");
        err.statusCode = 401;
        throw err;
      }
      deleteImage(post.imageUrl);
      return Post.findByIdAndDelete(postId);
    })
    .then((result) => {
        return User.findById(req.userId);
    })
    .then(user=>{
        user.posts.pull(postId);
        return user.save();
    })
    .then(result=>{
        io.getIo().emit('posts',{action:'deleted',post:postId});
        res.status(200).json({ message: "post deleted" });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

const deleteImage = (filepath) => {
  filepath = path.join(__dirname, "..", filepath);
  fs.unlink(filepath,err=>{
      if(err){
          console.log(err);
      }
    });
};

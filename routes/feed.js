const express=require('express');
const feedController=require('../controllers/feed');
const {body}=require('express-validator');
const isAuth=require('../middleware/is-Auth');
const router=express.Router();

router.get('/posts',isAuth,feedController.getPosts);
router.post(
  "/post",
  [
    body("title")
      .trim()
      .isLength({ min: 5 }),
    body("content")
      .trim()
      .isLength({ min: 5 })
  ],
  isAuth,
  feedController.createPost
);
router.get('/post/:postId',isAuth,feedController.getSinglePost);

// router.use((error,req,res,next)=>{
//     const statusCode=error.statusCode || 500;
//     const message=error.message;
//     console.log(error);
//     res.status(statusCode).json({message:message});
// })

router.put(
  "/post/:postId",
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  isAuth,
  feedController.putUpdatePost
);

router.delete('/post/:postId',isAuth,feedController.deletePost);
module.exports=router;
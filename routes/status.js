const express=require('express');
const router=express.Router();
const {body}=require('express-validator');
const statusControllers=require('../controllers/status');
const isAuth=require('../middleware/is-Auth');

router.get('/status',isAuth,statusControllers.getStatus);

router.post('/status',body('status').trim().notEmpty(),isAuth,statusControllers.postStatus);

module.exports=router;
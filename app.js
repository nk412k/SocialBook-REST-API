const express=require('express');
const feedRoutes=require('./routes/feed');
const authRoutes=require('./routes/auth');
const statusRoutes=require('./routes/status');
const bodyParse=require('body-parser');
const mongoose=require('mongoose')
const path=require('path');
const cors = require("cors");
const multer=require('multer');

const app=express();

const fileStorage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'images');
    },
    filename:(req,file,cb)=>{
        cb(null, Math.random() * 99999 + "-" + file.originalname);
    }
});

const fileFilter=(req,file,cb)=>{
    if(file.mimetype=='image/png' || file.mimetype=='image/jpg' || file.mimetype=='image/jpeg'){
        cb(null,true)
    }
    else{
        cb(null,false);
    }
};

app.use(bodyParse.json());
app.use(multer({storage:fileStorage,fileFilter:fileFilter}).single('image'));
app.use('/images',express.static(path.join(__dirname,'images')));

app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','GET, POST, DELETE, PUT, PATCH');
    res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
    next();
})



app.use('/feed',feedRoutes);
app.use('/auth',authRoutes);
app.use(statusRoutes);

app.use((error,req,res,next)=>{
    console.log(error);
    const statusCode=error.statusCode || 500;
    const data=error.data;
    const message= error.message;
    res.status(statusCode).json({message:message,data:data});
})

mongoose
  .connect(
    "mongodb+srv://@cluster0.grwrf.mongodb.net/socialbook?retryWrites=true&w=majority"
  )
  .then((result) => {
    const server=app.listen(8080);
    const io = require("./socket").init(server);
    io.on('connection',socket=>{
        console.log('Connection created');
    });
  })
  .catch((err) => console.log(err));


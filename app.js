//assignment5:- Develop a login , regis app with dashboard with activation link , image upload in registration and reset password features ?
const express=require('express');
const exphbs=require('express-handlebars');
const mongoose=require('mongoose');
const session = require('./middlewares/sessionMiddleware');//importing session middleware
const userRoutes = require('./routes/userRoutes');

require('dotenv').config();//.env to hide the confedential data
const MONGODB_URI=process.env.DB_URI;//Mongo DB Connection
const app=express();
const PORT=process.env.PORT;

app.use(express.json());//to parsing body in json
app.use(express.urlencoded({extended:false}));
app.use(express.static("./uploads/"))//adds a middleware for serving static files to  Express app
app.use(session);//using session middleware

app.engine('handlebars', exphbs.engine());//setting up handlebars engine
app.set('view engine', 'handlebars');
app.set('views', './views');//setting up views 

mongoose.connect(MONGODB_URI)
.then(res=>{console.log(`DB CONNECTED`);})
.catch(err=>{console.log(err.message);});//establishing connection with mongoDB

app.use("/",userRoutes);
app.use("*",(req,res)=>{
    res.status(404).render("404")
});//handling unwanted pages

app.listen(PORT,(err)=>{
    if(err) throw err;
    console.log(`listening on port :${PORT}`);
});//running server 

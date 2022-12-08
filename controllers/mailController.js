const nodemailer = require("nodemailer");
const hbs = require('nodemailer-express-handlebars');
require('dotenv').config();

let transporter=nodemailer.createTransport({
    service:"gmail",
    port:587,
    secure:false,
    auth:{
        user:process.env.EMAIL,
        pass:process.env.EMAIL_PASSWORD
    }
});//Nodemailer Tunneling

transporter.use('compile', hbs(
    {
        viewEngine:"nodemailer-express-handlebars",
        viewPath:"emailViews/emailTemplates/",
        
    }
));//Setting up Email Template 

// Reset Password Mail Handler
const activateAccountMail=(data)=>{

    const {_id,email,username}=data;
    let mailOptions={
        from:process.env.EMAIL,
        to:email,
        subject:"Activate your account",
        template:'activation',
        context:{
            username:username,
            id:_id }
    };

    //Email Sending
    transporter.sendMail(mailOptions,(err,info)=>{
        if(err){ console.log(err)}
        else{
            res.redirect("/login")
        }
    });
};

// Reset Password Mail Handler
const resetPasswordMail=(token,data)=>{

    const {_id,email,username}=data;
    let mailOptions={
        from:process.env.EMAIL,
        to:email,
        subject:"Reset Password Link",
        template:'resetpassword',
        context:{
            token:token,
            id:_id,
            username:username
        }
    }
    
    //Email Sending
    transporter.sendMail(mailOptions,(err,info)=>{
        if(err){ console.log(err)}
        else{
            return res.render("forgotpassword",{succs:"Reset Password Link send to your email"});
        }
    })
};


module.exports={
    activateAccountMail,
    resetPasswordMail
};
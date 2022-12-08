const bcrypt=require('bcrypt');// to hash the data
const crypto=require('crypto');// to encode the data
const tokenModel = require('../models/Token');
const userModelSchema = require('../models/User');
const upload = require('./fileUploadController');
const { activateAccountMail, resetPasswordMail } = require('./mailController');
const uploadSingle=upload.single('profileupload');
require('dotenv').config();

const defaultPage=(req,res)=>{
    if(req.session.username){
        return res.redirect("/dashboard");
    }else{
        return res.redirect("/login")
    }
};//rendering default page

const registrationRender=(req,res)=>{
    if(req.session.username){
        return res.redirect("/dashboard")
    }
    return res.render("registration")
}

const registerUser=async(req,res)=>{

    try {

        if(req.session.username){
            return res.redirect("/dashboard")
        }
        uploadSingle(req,res,async(err)=>{
            if(err)
            {
                return res.render('registration',{error:err.message})
            }
            else{
                let {email,username,password}=req.body;
                let hashPassword=await bcrypt.hash(password,10);//hashing password with 10 salt round
                let user = await userModelSchema.findOne({username});//getting user document in user variable
    
                if(!user){

                    userData=new userModelSchema({email,username,password:hashPassword,image:req.file.filename});
                    userData.save();
                    activateAccountMail(userData);//activation mail send
                    return res.render("registration", { succs: "Activation Email Sended to your mail" });
                }
                else{
                    return res.render("registration", { error: "User Already Registered" });
                }
            }
        })
        
    } catch (error) {
        return res.render("registration", { error: "User Already Registered" });
    }
}

const activateAccount=async(req,res)=>{
    const {id}=req.params;
    try {
        await userModelSchema.findOneAndUpdate({_id:id},{$set:{status:1}});//if user click on activate account link status set to 1 in DB
        // let data = await userModelSchema.findOne({_id:id});
        res.redirect('/');
    } catch (error) {
        console.log(error);
        res.redirect("/login");
    }
}

const loginUser=async(req,res)=>{
    const {username,password}=req.body;
    try {

        let data = await userModelSchema.findOne({username});
        if(data){
            if(bcrypt.compareSync(password,data.password)){//compare password with hashed password
                req.session.username=data.username;
                return res.redirect('/dashboard');
            }
            else{
                return res.redirect("/login?msg=fail");
            }
        }
        else{
            return res.redirect("/login?msg=fail");
        }
        
    } catch (error) {
        console.log(error);
        return res.redirect("/login?msg=fail");
    }
}

const loginRender=(req,res)=>{
    if(req.session.username){
        return res.redirect("/dashboard")
    }
    let auth = req.query.msg ? true : false;
    if (auth) {
        return res.render("login", { error: 'Invalid username or password' });
    }
    else {
        return res.render("login");
    }
}

const dashboard=async(req,res)=>{
    try {
    let username=req.session.username;//checking if username session is there or not
    if(username){
        let data=await userModelSchema.findOne({username});
        return res.render("dashboard",{username:username,imgPath:data.image,email:data.email,status:data.status});
    }
    else{
        return res.redirect("/login");
    }
        
    } catch (error) {
        console.log(error);
        return res.redirect("/login");
    }    
}

const logout=(req,res)=>{//when logout called session will be destroyed
    req.session.destroy((err) => {
        res.redirect('/') // will always fire after session is destroyed
      })
}

const downloadSingleFile=async(req,res)=>{
    const folderpath="./uploads"
    let username=req.session.username;
    if(username){
        let data=await userModelSchema.findOne({username});
        if(data){
            res.download(folderpath+`/${data.image}`,(err)=>{
                if(err){console.log(error);}//downloading image file
            })
        }
    }
    else{
        return res.redirect("/");
    }
}

const changePasswordRender=(req,res)=>{
    return res.render('changepassword');
}

const changePassword=async(req,res)=>{
    let {password,newpassword}=req.body;
    let username=req.session.username;
    if(username){
        let data=await userModelSchema.findOne({username});
        if(bcrypt.compareSync(password,data.password)){//compare password with hashed password
            let hashPwd = await bcrypt.hash(newpassword,10);//hashing new password
            await userModelSchema.findOneAndUpdate({username:username},{$set:{password:hashPwd}});
            return res.render("changepassword", { succs: 'New Password Changed' });

        }
        else{
            return res.render("changepassword", { error: 'Password Not Matched' });
        }
    }
    else{
        return res.render("changepassword", { error: 'Password Not Matched' });
    }
}

const forgotPasswordRender=(req,res)=>{
    return res.render("forgotpassword");
}

const forgotPasswordHandler=async(req,res)=>{
    const {email}=req.body;
    let user=await userModelSchema.findOne({email});
    if(user){
        let token = await tokenModel.findOne({userId:user._id});
        if(token) await tokenModel.deleteOne();//deleting the token if exist
        let userToken=crypto.randomBytes(32).toString("hex");//generating random 32 bytes hexadecimal token
        const hashedToken=await bcrypt.hash(userToken,10);//hashing the token
        token = new tokenModel({
            userId:user._id,
            token:hashedToken,
            createdAt:Date.now()
        });
        token.save();

        resetPasswordMail(userToken,user);//reset password email
        return res.render("forgotpassword",{succs:"Please Check Your Email"});
    }
    else{
        return res.render("forgotpassword",{error:"Email is not exists"});
    }
}

const resetPasswordPage=(req,res)=>{
    const {id,token} = req.query;
    res.render("resetpassword",{id,token})
}

const resetPasswordHandler=async(req,res)=>{
    const {password,id,token}=req.body;
    let userToken=await tokenModel.findOne({userId:id});//finding token in token collection w.r.t userID
    if(!userToken){
        return res.render("resetpassword",{error:"Token Expire"});
    }

    const isValid=await bcrypt.compare(token,userToken.token);//checking whether form token is equal to token in DB
    if(!isValid){
        return res.render("resetpassword",{error:"Token Expire"});
    }

    const hashedPassword=await bcrypt.hash(password,10);//hashing the Password
    await userModelSchema.updateOne({_id:id},{$set:{password:hashedPassword}},{new:true});

    return res.render("resetpassword",{succs:"Password changed"})

}

module.exports={
    defaultPage,
    registrationRender,
    registerUser,
    activateAccount,
    loginRender,
    loginUser,
    dashboard,
    logout,
    downloadSingleFile,
    changePasswordRender,
    changePassword,
    forgotPasswordRender,
    forgotPasswordHandler,
    resetPasswordPage,
    resetPasswordHandler
}//exporitg modules
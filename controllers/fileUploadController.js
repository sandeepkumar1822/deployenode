const multer=require('multer');
const path=require('path');

//start upload code 
const storage=multer.diskStorage({
    destination:function(req,file,cb){
      cb(null,path.resolve(__dirname,'../',"uploads"))
    },
    filename:function(req,file,cb){
        fileExtension=path.extname(file.originalname);
        cb(null,file.fieldname+"-"+Date.now()+fileExtension)
    }
})
    
const upload=multer({storage:storage,
fileFilter:(req,file,cb)=>{
    if(file.mimetype=="image/png" || file.mimetype=="image/jpeg"){
       cb(null,true)
    }
    else{
        cb(null,false);
         cb(new Error("Only png and jpg format allowed"))
    }
}});
//end upload

module.exports=upload;
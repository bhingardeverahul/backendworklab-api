const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const Users=require("./models/userModel")
const Tasks=require("./models/TaskModel")
require("./DB/connect")
const bcrypt=require("bcryptjs")
const jwt=require("jsonwebtoken")
const path=require("path")
require("dotenv").config()
const userAuth=require("./middleware/auth")
var cors = require('cors')
 app.use(express.json())
 app.set("view engine","ejs")
 app.set("views",path.join(__dirname,"./views"))

app.use(cors())
const nodemailer = require("nodemailer");
const multer = require("multer");
app.use(express.static("public"))
// upload files/images
// const multipart = require('connect-multiparty');
// const multipartMiddleware = multipart(); 

const storage = multer.diskStorage({
  destination:function(req,file,cb){
     cb(null,path.join(__dirname, './public/Uploads'));
  },
  filename:function(req,file,cb){
     const name = Date.now()+'-'+file.originalname;
     cb(null,name);
  }
});
const upload = multer({storage:storage}).single("images")
// app.get("*",(req,res)=>{
// res.send("/prac_app/src/components/Signup.js")
// })
app.post('/signup',upload,async(req, res) => {
  const{email}=req.body
  try {
    // const newPassword = await securePassword(req.body.password);
    const token=jwt.sign({email:email},process.env.SECRET_KEY, {expiresIn:"1min"})
    // const token = jwt.sign({email:email}, process.env.SECRET_KEY,)
    const newPassword =await bcrypt.hash(req.body.password,10);
    const user=new Users({
      name:req.body.name,
      email : req.body.email ,
      password:newPassword,
      images:req.file.filename,
     
      verify:false
    }) 

    // const dataId = {
    //   user: {
    //   },
    //   id: user.id,
    // };
    // const token = jwt.sign({email:email}, process.env.SECRET_KEY, {
    // const token = jwt.sign(dataId, process.env.SECRET_KEY, {
    // //   // expiresIn: "1m",
    // }); 
    const transporter = nodemailer.createTransport({
        host:'smtp.gmail.com',
        port:587,
        secure:false,
        requireTLS:true,
        auth:{
            user:process.env.EMAIL_VERIFY,
            pass:process.env.EMAIL_CODE
        }
    });
    const mailOptions = {
        from:process.env.EMAIL_VERIFY,
        to:user.email,
        subject:'For Verification mail',
        html:`<p>Hii ${user.name}, please click here to <a href=https://worklab-app-b4tl.onrender.com/verify/${token}> Verify </a> your mail.</p>`
    }
    transporter.sendMail(mailOptions, function(error,info){
        if(error){
            console.log(error);
        }
        else{
            console.log("Email has been sent:- ",info.response)
        }
    })
   
    const data=await user.save()
    console.log(data)
    success=true
    res.json({success,token:token})
      console.log("register successful....!")
     
  } catch (error) {
    console.log({error,message:"not register "})
  }
})


app.get('/verify/:token',async(req,res)=>{
  const { token } = req.params;
    try {
      if (token) {
        // token verify
        const isEmailVerified = jwt.verify(token, process.env.SECRET_KEY,{
          expiresIn : '5min'
        });
        if (isEmailVerified) {
          const getUser = await Users.findOne({
            email: isEmailVerified.email,
          });

          const saveEmail = await Users.findByIdAndUpdate(getUser._id, {
            $set: {
              verify: true,
            },
          });

          if (saveEmail) {
            res.render("verifylogin")
            success=true;
          res.status(200).json({success, message: "Email Verification Success" });
          }

          //
        } else {
          return res.status(400).json({ message: "Link Expired" });
        }
      } else {
        return res.status(400).json({ message: "Invalid URL" });
      }
 
} catch (error) {
      return res.status(400).json({ message: error.message });
    }
    })

//


app.post('/login',async(req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const user = await Users.findOne({ email: email });
    if (!user) {
      success = false;

      res.status(400).json({ success, message: "invalid user" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      success = false;
      res.status(400).json({ success, message: "invalid password" });
    }
  if (isMatch.verify===false) {
    res.status(401).send("Your Email is not verified")
    }else{
    const dataId = {
      user: {
        id: user.id,
      },
    };
    const token = jwt.sign(dataId, process.env.SECRET_KEY, {
      // expiresIn: "m",
    });
    success = true;
    res.json({ success, token: token });
    // console.log(isMatch);
    
    console.log(token);
    console.log({ message: "login  profile successfully" });
  }
  }catch{
    success=false
      res.status(500).json({success ,message:"Internal server Error"})
  }}
  )
  
app.post("/getuser", userAuth, async (req, res) => {
  try {
    //  const ;
    userID = req.user.id;
    const user = await Users.findById(userID).select("-password");
    res.json(user);
  } catch (error) {
    console.log({ message: "get all users invalid" });
  }
});

//emails

app.post('/forgotpassword', (req, res) => {
  const {email} = req.body;
  Users.findOne({email: email})
  .then(user => {
      if(!user) {
          return res.send({Status: "User not existed"})
      } 
      const token = jwt.sign({id: user.id}, process.env.SECRET_KEY, {expiresIn: "1d"})
      var transporter = nodemailer.createTransport({
        host:'smtp.gmail.com',
        port:587,
        secure:false,
        requireTLS:true,
          auth: {
            user:process.env.EMAIL_VERIFY,
            pass:process.env.EMAIL_CODE
          }
        });
        
        var mailOptions = {
          from:process.env.EMAIL_VERIFY,
          to:user.email,
          subject: 'Reset Password Link',
          html: `<p>Hii ${user.name},Please click here to <a href=https://worklab-app-b4tl.onrender.com/resetpassword/${user.id}/${token}> Verify </a> your mail.</p>`
        };
        
        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
            return res.send({Status: "Success"})
          }
        });
  })
})

app.post('/resetpassword/:id/:token', (req, res) => {
  const {id, token} = req.params
  const {password} = req.body

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
      if(err) {
          return res.json({Status: "Error with token"})
      } else {
          bcrypt.hash(password, 10)
          .then(hash => {
              Users.findByIdAndUpdate({_id: id}, {password: hash})
              .then(u => res.send({Status: "Success"}))
              .catch(err => res.send({Status: err}))
          })
          .catch(err => res.send({Status: err}))
      }
  })
})

app.get("/verifyLogin",async(req,res)=>{
try {
  const email = req.body.email;
  const userData = await Users.findOne({ email:email });
  if(userData){
    const transporter = nodemailer.createTransport({
      host:'smtp.gmail.com',
      port:587,
      secure:false,
      requireTLS:true,
      auth:{
          user:process.env.EMAIL_VERIFY,
          pass:process.env.EMAIL_CODE
      }
  });
  const mailOptions = {
      from:process.env.EMAIL_VERIFY,
      to:userData.email,
      subject:'For Checking mail already register or not',
      html:`<p>Hii ${userData.name}, please click here to <a href=https://worklab-app-b4tl.onrender.com/verify?${userData._id}> Verify </a> your mail.</p>`
  }
  transporter.sendMail(mailOptions, function(error,info){
      if(error){
          console.log(error);
      }
      else{
          console.log("Email has been sent:- ",info.response);
      }
  })
      res.send("Reset verification mail sent your mail id, please check.");
  }
  else{
      res.send("This email is not exist.");
  }

} catch (error) {
  console.log(error)
}
})

  
// active users data
app.get('/userinfo',userAuth, async(req, res) => {
  try {
    const GetUserdata=await Tasks.find({ user:req.user.id})
    res.json(GetUserdata)
  } catch (error) {
    console.log({message: " all users "})
  }
  
  })
 

app.post('/Addwork',userAuth,async(req, res) => {
  try {
    const AddUsersWorks=new Tasks({
      title:req.body.title,
      description:req.body.description,
      task:req.body.task,
      user:req.user.id
    })
    const saveWork=await AddUsersWorks.save()
    res.json(saveWork)
  } catch (error) {
    console.log(error +" when adding work  ")
  }
  
  })
  


app.put("/update/:id", userAuth, async (req, res) => {
  try {
    const { title, description, task} = req.body;
      // Create a WorkBase object
      const WorkBase = {};
      if (title) { WorkBase.title = title };
      if (description) { WorkBase.description = description};
      if (task) { WorkBase.task = task }; 

      // Find the note to be updated and update 
      // not nessaary below code of 3 code for validation use only
      let work = await Tasks.findById(req.params.id);
      if (!work) { return res.status(404).send("Not Found") }

      if (work.user.toString() !== req.user.id) {
          return res.status(401).send("Not Allowed");
      }
     let workData = await Tasks.findByIdAndUpdate(req.params.id, { $set: WorkBase }, { new: true })
      res.json({ workData });
  } catch (error) {
    console.log({ message: "Updated invalid" });
  }
});


app.delete("/delete/:id", userAuth, async (req, res) => {
  try {
            // Find the note to be delete and delete it
            let work = await Tasks.findById(req.params.id);
            if (!work) { return res.status(404).send("Not Found") }
    
            // Allow deletion only if user owns this work
            if (work.user.toString() !== req.user.id) {
                return res.status(401).send("Not Allowed");
            }
    
            work = await Tasks.findByIdAndDelete(req.params.id)
            res.json({ "Success": "work has been deleted", work: work });
    
  } catch (error) {
    console.log({ message: "delete invalid" });
  }
});


app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`)
})

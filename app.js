require('dotenv').config();
const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const path = require("path");
const ejs=require("ejs");
// const encrypt=require("mongoose-encryption");
// const md5=require("md5");//level 3 security
const bcrypt=require("bcrypt");//level 4 security
const saltRounds=10;
const port=3000;
const app=express();

app.use("/public",express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));

// secret string
const secret=process.env.SECRET;

mongoose.connect("mongodb://127.0.0.1:27017/userDB",{useNewUrlParser:true})

// const userSchema=mongoose.Schema({
//     email: {
//         type: String,
//         required: true,
//       },
//     password: {
//         type: String,
//         required: true,
//       }
// });
// new schema for encryption
const userSchema=new mongoose.Schema({
    email: {
        type: String,
        required: true,
      },
    password: {
        type: String,
        required: true,
      }
});


// // Always add this step before creating a model and we are encrypting only password here, if email is also encrypted then we'll not be able to find the user in the database.
// userSchema.plugin(encrypt,{secret:secret,encryptedFields:["password"]});//level 2 security

const User=mongoose.model("User",userSchema);

app.get("/",(req,res)=>{
    res.render("Home");
});
app.get("/login",(req,res)=>{
    res.render("login");
});
app.get("/register",(req,res)=>{
    res.render("register");
});


app.post("/register",(req,res)=>{
    bcrypt.hash(req.body.password,saltRounds,(err,hash)=>{//level 4 security
      const newUser=User({
        email:req.body.username,
        password:hash,
    });
    newUser.save((err)=>{
        if (err) {
            console.log(err);
        }else{
            res.render("secrets");
        }
    });   
    });
   
});

app.post("/login",(req,res)=>{
    const username=req.body.username;
    const password=req.body.password;

    User.findOne({email:username},(err,foundUser)=>{
        if (err) {
            console.log(err);
        }else{
            if (foundUser) {//level 5  security
                bcrypt.compare(password,foundUser.password,(err,result)=>{
                    if (result===true) {
                        res.render("secrets");        
                    }
                });
                
            }
        }
    });

});












app.listen(port,()=>{
  console.log(`Example app listening on port ${port}!`);
});
require('dotenv').config();
const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const path = require("path");
const ejs=require("ejs");
// const encrypt=require("mongoose-encryption");
// const md5=require("md5");//level 3 security 
const passport=require("passport"); 
const session=require("express-session"); 
const passportLocalMongoose=require("passport-local-mongoose"); 
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate=require("mongoose-findorcreate");
const port=3000;
const app=express();

app.use(express.static("public"));//imp
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));

// imp to use here
app.use(session({
    secret:"My Name Is Anthony",
    resave:false,// don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
}));

// manage sessions
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB",{useNewUrlParser:true})
// mongoose.set("useCreateIndex",true);
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
    email: String,
  password: String,
  googleId: String //to identify users as an unique google user
});

//MONGOOSE SCHEMA PLUGIN
userSchema.plugin(passportLocalMongoose,{usernameField:"username"});
userSchema.plugin(findOrCreate);

const User=new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(function(user, cb) {
//     process.nextTick(function() {
//       cb(null, { id: user.id, username: user.username, name: user.name });
//     });
//   });
  
//   passport.deserializeUser(function(user, cb) {
//     process.nextTick(function() {
//       return cb(null, user);
//     });
//   });
passport.serializeUser(function(user, done) {
      done(null,user); 
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id,(err,user)=>{
        done(null,user);
    });
  });

//   GOOGLE STRATEGY
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET ,
    callbackURL: "http://localhost:3000/auth/google/secrets",
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id,username:profile.displayName }, function (err, user) {
        console.log(profile);
      return cb(err, user);
    });
  }
));
app.get("/",(req,res)=>{
    res.render("Home");
});

app.get("/auth/google",
    passport.authenticate('google',{scope:["profile"]}));

app.get("/auth/google/secrets",passport.authenticate('google',{failureRedirect:"/login"}),(req,res)=>{
    // successfully authenticated,redirected to secrets
    res.redirect("/secrets");
});

app.get("/login",(req,res)=>{
    res.render("login");
});

app.get("/register",(req,res)=>{
    res.render("register");
});

app.get("/secrets",(req,res)=>{
    if (req.isAuthenticated()) {
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
});

app.get("/logout",(req,res)=>{
    req.logout((err)=>{//callback necessary!
        console.log(err);
    });
    res.redirect("/");
});

app.post("/register",(req,res)=>{
   User.register({username:req.body.username},req.body.password,(err,user)=>{
    if (err) {
        console.log(err);
        res.redirect("/register");
    }else{
        passport.authenticate("local")(req,res,()=>{
            res.redirect("/secrets");
        });
    }

   });
});

app.post("/login",(req,res)=>{
    const user= new User({
        username:req.body.username,
        password:req.body.password
    });
    req.login(user,(err)=>{
        if (err) {
            console.log(err);
            res.redirect("/login");
        }else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/secrets");
            });
        }
    });
});












app.listen(port,()=>{
  console.log(`Example app listening on port ${port}!`);
});
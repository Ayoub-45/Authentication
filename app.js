require("dotenv").config()
const express=require("express");
const ejs=require("ejs");
const bodyParser=require("body-parser");
const app=express();
const mongoose=require("mongoose");
const session=require("express-session");
const passport=require("passport")
const passportLocalMongoose=require("passport-local-mongoose")
const findOrCreate=require("mongoose-findorcreate")
app.set("view engine","ejs");
const url="mongodb://127.0.0.1:27017/userDB"
const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
    }
);


async function connectDB(url){
    try{
        const info=await  mongoose.connect(url);
        console.log("Successfully connected.");
    }
    catch(err){
        console.log(err)
    }
}
connectDB(url)
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"))
app.use(session({
    secret:"Our little secret.",
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate)
const User=mongoose.model("user",userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

  const GoogleStrategy = require('passport-google-oauth20').Strategy;

  passport.use(new GoogleStrategy({
      clientID: process.env.CLIENT_ID,
      clientSecret:process.env.CLIENT_SECRET ,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
    
    },
    function(accessToken, refreshToken, profile, cb) {
      console.log(profile)
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  ));

app.get("/",function(req,res){
    res.render("home");
})
app.get("/auth/google",passport.authenticate("google",{scope:["profile"]} ))

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  });
app.get("/login",function(req,res){
    res.render("login");
});
app.get("/register",function(req,res){
    res.render("register");
})
app.get("/secrets",async function(req,res){
  try{
    foundUser=await User.find({"secret":{$ne:null}})
    if(foundUser){
      res.render("secrets",{usersWithSecrets:foundUser})
    }
  } 
  catch(err){
    console.log(err)
  }
});
app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  }
  else{
    res.redirect("/login");
  }
})
  app.get("/logout",function(req,res){
    req.logOut(function(err) {
          if (err) { 
            console.log(err)
         }
          res.redirect('/');
        });
      });
app.post("/register",async function(req,res){
   const data=await  User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
        console.log(err);
        res.redirect('/register');
    }
    else{
        passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets")
        })
    }
   })
    });
app.post("/submit",async function(req,res){
  const submittedSecret=req.body.secret
  try{
    const foundUser=await User.findById({_id:req.user._id});
    if(foundUser){
      foundUser.secret=submittedSecret;
      foundUser.save();
      res.redirect("/secrets");
    }
  }
  catch(err){
    console.log(err)
  }
  
})
app.post("/login",async function(req,res){
  const user=new User({
    email:req.body.username,
    password:req.body.password
  })
 req.logIn(user, function(err){
    if(err){
        console.log(err);
    }
    else{
        passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets")
        })
    }
 })
})



app.listen(3000,function(req,res){
    console.log("Server is listening on port 3000.")
})
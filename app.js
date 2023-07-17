require("dotenv").config()
const express=require("express");
const ejs=require("ejs");
const bodyParser=require("body-parser");
const app=express();
const mongoose=require("mongoose")
const url="mongodb://127.0.0.1:27017/userDB"
const encrypt=require("mongoose-encryption")
const userSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }
});

userSchema.plugin(encrypt, { secret:process.env.SECRET,encryptedFields: ['password'] });
const User=mongoose.model("user",userSchema);

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
app.set("view engine","ejs");
app.get("/",function(req,res){
    res.render("home");
})
app.get("/login",function(req,res){
    res.render("login");
});
app.get("/register",function(req,res){
    res.render("register");
})
app.post("/register",async function(req,res){
    newUser=new User({
        email:req.body.username,
        password:req.body.password
    })
    try{
        const data=await newUser.save();
        if(data){
            console.log("successfully saved to the database.")
            res.render("secrets");
        }
    }
    catch(err){
        console.log(err)
    }
});
app.post("/login",async function(req,res){
    try{
        const user={
            email:req.body.username,
            password:req.body.password
        };
        const foundUser=await User.findOne({email:user.email});
        if (foundUser){
            if(foundUser.password===user.password){
                res.render("secrets")
            }
        }
        else{
            console.log("User not found ! check your credentials");
        }
    }
    catch(err){
        console.log(err)
    }
})



app.listen(3000,function(req,res){
    console.log("Server is listening on port 3000.")
})
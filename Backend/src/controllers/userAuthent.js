const redisClient = require("../config/redis");
require('dotenv').config();
const User =  require("../models/user")
const validate = require('../utils/validator');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const Submission = require("../models/submission")

const register = async (req,res)=>{
    
    try{
        // validate the data;
      validate(req.body); 
      const {firstName, emailId, password}  = req.body;

      req.body.password = await bcrypt.hash(password, 10);
      req.body.role = 'user'
    //
    
     const user =  await User.create(req.body);
     const token =  jwt.sign({_id:user._id , emailId:emailId, role:'user'},process.env.JWT_KEY,{expiresIn: 60*60});
     res.cookie('token',token,{maxAge: 60*60*1000});
     res.status(201).send("User Registered Successfully");
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}


const login = async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!emailId || !password) {
      throw new Error("Invalid Credentials");
    }

    const user = await User.findOne({ emailId });

    if (!user) {
      throw new Error("Invalid Credentials");
    }

    const match = await bcrypt.compare(password, user.password); // ✅ FIXED

    if (!match) {
      throw new Error("Invalid Credentials");
    }

    const token = jwt.sign(
      { _id: user._id, emailId: user.emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 }
    );

    res.cookie("token", token, { maxAge: 60 * 60 * 1000 });
    res.status(200).send("Logged In Successfully");
  } catch (err) {
    res.status(401).send("Error: " + err.message);
  }
};


// logOut feature

const logout = async(req,res)=>{

    try{
        const {token} = req.cookies;
        const payload = jwt.decode(token);

        await redisClient.set(`token:${token}`,'Blocked');
        await redisClient.expireAt(`token:${token}`,payload.exp);
    //    Token add kar dung Redis ke blockList
    //    Cookies ko clear kar dena.....

    res.cookie("token",null,{expires: new Date(Date.now())});
    res.send("Logged Out Succesfully");

    }
    catch(err){
       res.status(503).send("Error: "+err);
    }
}


const adminRegister = async(req,res)=>{
    try{
        // validate the data;
    //   if(req.result.role!='admin')
    //     throw new Error("Invalid Credentials");  
      validate(req.body); 
      const {firstName, emailId, password}  = req.body;

      req.body.password = await bcrypt.hash(password, 10);
    //
    
     const user =  await User.create(req.body);
     const token =  jwt.sign({_id:user._id , emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
     res.cookie('token',token,{maxAge: 60*60*1000});
     res.status(201).send("User Registered Successfully");
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}

const deleteProfile = async(req,res)=>{
  try {
    const userId= req.res._id;
    //user schema se delete hogaya user 
    //ab submission se bhi delete karne honge
    User.findByIdAndDelete(userId);
    Submission.deleteMany({userId});

    res.status(200),send("User Profile deleted Succesfully !");
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
}


module.exports = {register, login,logout,adminRegister,deleteProfile};
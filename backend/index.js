import express from "express"
import dotenv from "dotenv"
import mongoose from "mongoose"
import cors from "cors"
import jwt from "jsonwebtoken"
import {authenticateToken} from "./utilis.js"
import User from "./model/user.model.js"
import Note from "./model/note.model.js"
const app=express();
dotenv.config();
app.use(express.json());
app.use(
    cors({
        origin:"*",
    })
)
const URI=process.env.MongoDBURI;
try{
    mongoose.connect(URI);
         console.log("connected to MongoDB")
} catch(error){
    console.log("Error:", error);
}

// Creating the new account.....

app.post("/create-account",async(req,res)=>{
     const {fullName,email,password}=req.body;

     if(!fullName){
        return res
        .status(400)
        .json({error:true,message:"full name is required"})
     }
     
     if(!email){
        return res
        .status(400)
        .json({error:true,message:"email is required"})
     }
     
     if(!password){
        return res
        .status(400)
        .json({error:true,message:"password is required"})
     } 
     const isUser=await User.findOne({email:email});
     if(isUser){
        return res.json({
            error:true,
            message:"User already exits",
        });
     }
     const user=new User({
        fullName,
        email,
        password
     })
     await user.save();
     const accessToken=jwt.sign({user},process.env.ACCESS_TOKEN_SECERT,{
        expiresIn:"6000m"
     });
     return res.json({
        error:false,
        user,
        accessToken,
        message:"user has been Registered  successfully"
     })
})
//  login in the application....
app.post("/login", async (req,res)=>{
    const {email,password}=req.body;

    if(!email){
        return res
        .status(400)
        .json({message:"please enter the email id"});
    }
    if(!password){
        return res
        .status(400)
        .json({message:"please enter the password"});
    }
    const userInfo= await User.findOne({email:email});
    if(!userInfo){
         return res
         .status(404)
         .json({message:"No user found"});
    }
    if(userInfo.email==email&&userInfo.password==password){
        const user={user:userInfo}
        const accessToken=jwt.sign({user},process.env.ACCESS_TOKEN_SECERT,{
            expiresIn:"60000m",
        });
        return res.json({
            error:false,
            message:"Login successfully",
            email,
            accessToken
        })
    }
    else{
         return res.status(404).json({
            error:true,
            message:"Invalid credential"
        }) ;
    }

})

// add the notes
app.post("/add-note",authenticateToken,async(req,res)=>{
    const {title,content,tags}=req.body;
    const {user}=req.user;
    if(!title) return res.status(400).json({error:true, message:"title is required"})
    if(!content) return res.status(400).json({error:true, message:"content is required"})
    try {
        const note =new Note({
            title,
            content,
            tags:tags||[],
            userId:user.user._id,
        });
        await note.save();
        return res.status(200).json({
            error:false,
            note,
            message:"the note has been added sucessfully"
        })
    } catch (error) {
        return res.status(500).json({message:"Internal server isuse"})
    }
})

// edit the notes...
app.put("/edit-note/:NoteId",authenticateToken,async(req,res)=>{
    const noteId=req.params.NoteId;
    const {title,content,tags,isPinned}=req.body;
    const {user}=req.user;
    if(!title&&!content&&!tags) return res.status(400).json({message:"No changes provided"});
    try {
        console.log(user._id);
        console.log(noteId)
        const  note= await Note.findOne({_id:noteId , userId:user.user._id});
        if(!note){
            return res.status(404).json({error:true, message:"Note not found"});
        }
        if(title) note.title=title;
        if(content) note.content=content;
        if(tags) note.tags=tags;
        if(isPinned) note.isPinned=isPinned;
        await note.save();
        return res.status(200).json({
            error:false,
            message:"note is updated",
            note
        })
    } catch (error) {
         return res.status(500).json({error:true, message:"Internal server issue"});
    }

})
app.get("/get-notes",authenticateToken,async(req,res)=>{
    const {user}=req.user;
    try {
        const notes=await Note.find({userId:user.user._id}).sort({isPinned:-1});
        return res.status(200).json({
            error:false,
            notes,
            message:"all the notes are retrived"
     })
    } catch (error) {
        return res.status(500).json({error:true,message:"internal server issue"})
    }
})
app.delete("/delete/:NoteId",authenticateToken,async(req,res)=>{
    const noteId=req.params.NoteId;
    const {user}=req.user;
    try {
    const note=await Note.findOne({ _id:noteId,userId:user.user._id });
    if(!note) return res.json({error:true,message:"NoteId is invalid"})
    await Note.deleteOne({_id:noteId})  
    return res.status(200).json({ error: false, message: "Note deleted successfully" });  
    } catch (error) {
        return res.status(500).json({error:true,message:"Internal server issue"})
    }
    
})
app.listen(3000,()=>{
    console.log("server is running at  3000 port");
})
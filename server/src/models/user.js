import mongoose, { Schema } from "mongoose";

const userModel = new mongoose.Schema({
    name:{
        type: String,
        require:"true"
    },
    email:{
        type: String,
        require:"true"
    },
    password:{
        type: String,
        require:"true"
    },
    role:{
        type: String,
        enum:["user","admin"],
        default:"user"
    }
})

export default mongoose.model("user", userModel);
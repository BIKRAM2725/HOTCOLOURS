// import userModel from '../models/user.js';
// import bcrypt from "bcrypt";
// import JWT from 'jsonwebtoken';

// export const registerController = async (req, res) => {
    
//     try
//     {
//         const{name , email , password} = req.body;

//         // if( !email || !password)
//         // {
//         //     console.log("Please fill all the field !");
//         // }
//         if( !email || !password)
//         {
//             return res.status(400).json({
//                 error:"Please fill all the field !"
//             })
//         }

//         const user = await userModel.findOne({email});

//         // if(user)
//         // {
//         //     console.log("user already exist")
//         // }

//         if(user) 
//         {
//             return res.status(400).json({
//                 error:"user already exist"
//             })
//         }

//         const salt = await bcrypt.genSalt(10);
//         const hashPassword = await bcrypt.hash(password , salt);

//         const newUser = await userModel({
//             name,
//             email,
//             password: hashPassword,
//         }).save();

//         return res.status(200).send({
//             success: true,
//             message:'user has been created'
//         })
//     }
//     catch(error)
//     {
//         console.log(error);
//         res.status(500).send({
//             success:false,
//             message:'Problem in API'
//         })
//     }
// }

// export const loginController = async (req, res) => {
    
//     try{
        
//         const{email, password} = req.body;

//         if(!email || !password)
//         {
//             return res.status(400).json({
//                 error:"Fill al the field !"
//             })
//         }

//         const user = await userModel.findOne({email});

//         if(!user)
//         {
//             return res.status(400).json({
//                 error:"Register first"
//             })
//         }

//         const isMatch = await bcrypt.compare(password,user.password)

//         if(!isMatch)
//         {
//             return res.status(400).json({
//                 error:"Invalid Password"
//             })
//         }

//         const token = await JWT.sign({id: user._id}, process.env.JWT_SECRET, {

//             expiresIn:"7d"
//         })

//         return res.status(200).send({
//             success:true,
//             message:"Login Successful",
//             token,
//             user:
//             {
//                 id: user._id,
//                 email: user.email,
//                 role: user.role
//             },
//         })
//     }

//     catch(error)
//     {
//         return res.status(500).send({
//             success:false,
//             message:"Error in API"
//         })
//     }
// }

import userModel from '../models/user.js';
import bcrypt from "bcrypt";
import JWT from 'jsonwebtoken';

export const registerController = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Please fill all the fields!" });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      email,
      password: hashPassword,
    });
    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "User has been created",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Problem in API",
    });
  }
};

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Please fill all the fields!" });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Please register first" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const token = JWT.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error in API" });
  }
};

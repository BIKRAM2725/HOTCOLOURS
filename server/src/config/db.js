import mongoose from "mongoose";

export const ConnectToDb = async () => {

    try{
        const responce = await mongoose.connect(process.env.MONGODB_URL);
        console.log("Mongodb Connected Successfully");
    }
    catch(error)
    {
        console.log("Error to connect");
        process.exit(1);
    }
}
import mongoose from "mongoose";


export const connectMongoDB=()=>{
    return mongoose.connect(
      "mongodb+srv://psvishnu373:vishnu@cluster0.gtnf5sy.mongodb.net/?retryWrites=true&w=majority"
    );
}
const mongoose=require('mongoose')

const connectDb =async()=>{
    try{
    await mongoose.connect(process.env.MONGODB_URI)
                .then(()=>console.log("Db Connect"))
    }
    catch (err) {
        console.log(`error message: ${err.message}`);
    }
}

 module.exports = {connectDb}
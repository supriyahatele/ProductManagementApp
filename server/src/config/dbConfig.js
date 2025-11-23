const mongoose = require('mongoose');
const connectionToDB = async() => {
    try{
    await mongoose.connect(process.env.DB_URL) 
    console.log('db connected')
    }catch(err){
        console.error(err);
        process.exit(1);
    }
}
module.exports = {
    connectionToDB
}
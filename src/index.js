import dotenv from 'dotenv'
import connectDB from './db/index.js'
import app from './app.js'

dotenv.config()

connectDB()
.then(() => {
    const server = app.listen(process.env.PORT || 4000, () => {
        console.log(`server running on PORT ${process.env.PORT}`);
    });

    server.on("error", () => {
        console.log("server error", err);
        
    })
})
.catch((err) => {
    console.error("MongoDB connection failed !!!", err);
    
})
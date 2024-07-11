import jwt from "jsonwebtoken"
import { configDotenv } from "dotenv"

configDotenv()
const secretKey = process.env.SECRET_KEY

export default function(req, res, next) {
    try {
        const token = req.cookies.token
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" })
        }
        const decode = jwt.verify(token, secretKey)

        req.user = decode
        next()
    }catch(err){
        console.log(err)
    }
}
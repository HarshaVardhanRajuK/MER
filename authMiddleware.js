import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";

configDotenv();
const secretKey = process.env.SECRET_KEY;

const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    console.log(req)
    console.log(token)
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const decoded = jwt.verify(token, secretKey);

    req.user = decoded;
    next();
  } catch (err) {
    console.log(err);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export default authMiddleware;

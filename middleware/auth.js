const jwt=require("jsonwebtoken")
const SECRET_KEY="Rahul03"
// const Users=require("../models/userModel")
const userAuth=async(req,res,next)=>{
    const token = req.header('auth-token');
    if (!token) {
        res.status(401).send({ error: "Please authenticate using a valid token" })
    }
    try {
        const data = jwt.verify(token, SECRET_KEY);
        req.user = data.user;
        next();
    } catch (error) {
        res.status(401).send({ error: "Please authenticate using a valid token" })
    }

}

module.exports=userAuth


// let token;
// const { authorization } = req.headers;
// if (authorization && authorization.startsWith("Bearer")) {
//   try {
//     token = authorization.split(" ")[1];
//     // verify token
//     const { userID } = jwt.verify(token, "pleaseSubscribe");
//     // Get User from Token
//     req.user = await authModel.findById(userID).select("--password");
//     next();
//   } catch (error) {
//     return res.status(401).json({ message: "unAuthorized User" });
//   }
// } else {
//   return res.status(401).json({ message: "unAuthorized User" });
// }
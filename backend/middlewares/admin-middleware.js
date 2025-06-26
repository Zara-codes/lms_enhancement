import { ErrorHandlerService } from "../services/index.js";

const adminMiddleware = (req,res,next) => {
    const role = req.userData.role;
    if(role === "Admin"){
        return next();
    }
    else{
        next(ErrorHandlerService.forbidden());
    }
}

export default adminMiddleware;
const hasAnyRoles = (userRoles, requiredRoles) => requiredRoles.some(role => userRoles.includes(role));

const access = (...roles) => {
    return (req, res, next) => {

        if(!req.user || !req.role){
            return res.status(401).json({msg:"Unauthorized- roles not matching"});
        }

        const userRoles = req.role;

        const hasAccess = roles.some(role => {
            if(Array.isArray(role)){
                return hasAnyRoles(userRoles, role);
            } else {
                return userRoles.includes(role);
            }
        })

        if(hasAccess){
            next();
        } else {
            res.status(403).json({msg:"Insufficient privileges. You donot have access to perform this task"});
        }

    }
}

module.exports = {
    access,
    hasAnyRoles
}
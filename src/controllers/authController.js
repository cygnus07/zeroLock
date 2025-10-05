import User from '../models/User.js'

class AuthController {
    static async checkAvailability(req,res,next) {
        try {
            const { email, username} = req.body
            const result = {
                email: null,
                username: null,
            }

            if(email) {
                const emailExists = await User.checkEmailExists(email)
                result.email = {
                    available: !emailExists,
                    value: email
                }
            } 

            if(username) {
                const usernameExists = await User.checkUsernameExists(username)
                result.username = {
                    available: !usernameExists,
                    value: username
                }
            }

            res.json({
                success: true,
                data: result,
            })
        } catch (error) {
            next(error)
        }
    }

    
}


export default AuthController
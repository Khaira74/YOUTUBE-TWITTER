// The default Error in JavaScript just has: name,message,stack

// But for APIs, you usually want to send extra info in the JSON response, like: HTTP status code (statusCode)
// ,Whether the request was successful (success),Extra details (errors),Optional custom stack trace

// ApiError extends Error so you keep all normal Error behavior and add API-specific fields.


class ApiError extends Error {
    constructor(
        statusCode,
        message= "Something went wrong",
        errors = [],
        stack = ""
// statusCode → HTTP status code (e.g., 404, 500)
// message → error description (default: "Something went wrong")
// errors → array/object for extra details (validation errors, etc.)
// stack → optional custom stack trace
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors

        if (stack) {
            this.stack = stack
        } else{
            Error.captureStackTrace(this, this.constructor)
        }
        // If a custom stack is provided, use it.Otherwise, capture the stack trace from where the error
        //  was created, skipping the constructor itself.



    }
}

export {ApiError}
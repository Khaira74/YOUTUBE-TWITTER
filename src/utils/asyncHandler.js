// THIS FILE CONTAIN A typical asyncHandler pattern used in Node.js/Express to cleanly handle
//  errors from asynchronous route handlers without needing to write try...catch in every controller.




// Why this file and code is just for request handlers=>>>
// In Express, request handlers are functions that take (req, res, next) and handle HTTP requests.
// If they are async and throw an error (or reject a promise), without this wrapper, you’d need to do:

// app.get("/users", async (req, res, next) => {
//     try {
//         const users = await User.find();
//         res.json(users);
//     } catch (err) {
//         next(err);
//     }
// });


// With asyncHandler, you can do:

// app.get("/users", asyncHandler(async (req, res) => {
//     const users = await User.find();
//     res.json(users);
// }));

// Here, asyncHandler automatically catches errors and passes them to Express’s error middleware using next(err).







const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
        // next(err) in Express is the way to tell Express:“Hey, I’ve got an error — please skip the rest of
        //  my code and pass this error to the error-handling middleware.”
        // next();        // goes to the next normal middleware
        // next(err);     // goes to the error-handling middleware
    }
}
// below is explanation

// export { asyncHandler }
// const asyncHandler = (requestHandler) => {

// requestHandler is your async route function (controller).

// You’re returning a new function that Express will actually use.

// return (req, res, next) => {

// This is the function that Express calls when the route is hit.

// It takes the same (req, res, next) parameters as a normal handler.

// Promise.resolve(requestHandler(req, res, next))

// Runs your requestHandler function.

// Promise.resolve() ensures it’s handled as a promise even if the handler is not explicitly async.

// If it’s async, it returns a promise automatically.

// .catch((err) => next(err))

// If the promise rejects (error thrown inside async function), the error is passed to Express via next(err).

// export { asyncHandler }

// So you can import it in other route files.











// const asyncHandler = () => {}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async () => {}

// function inside fuxcnion
// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }

export {asyncHandler}
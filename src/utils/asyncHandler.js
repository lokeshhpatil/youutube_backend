const asyncHandler = (fn) => async(err, req, res, next) => {
    try {
            await fn(req, res, next);
    } catch (error) {
        res.status(error.code || 201).json({
            success: false,
            message: error.message
        })
    }
}

export {asyncHandler}

// const asyncHandler = (fn) => {
//     return (req, res, next) => {
//         Promise.resolve(fn(req, res, next))
//         .catch((error) => next(error ))
//     }
// }


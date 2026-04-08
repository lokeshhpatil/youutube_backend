class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = []
  ) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.data = null;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
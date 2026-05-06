const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    const status = err.code === 'LIMIT_FILE_SIZE' ? 400 : err.status || 500;
    const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'Image must be 5MB or smaller'
        : err.message || 'Internal Server Error';

    res.status(status).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { error: err })
    });
};

const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
};

module.exports = {
    errorHandler,
    notFoundHandler
};

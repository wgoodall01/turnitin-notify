const {createError} = require('apollo-errors');

exports.UnauthenticatedError = createError('UnauthenticatedError', {
  message: 'Request was not authenticated.'
});

exports.BadAuthenticationError = createError('BadAuthenticationError', {
  message: 'Request had a malformed authentication header'
});

exports.DoesNotExistError = createError('DoesNotExistError', {
  message: 'Requested entity does not exist'
});

const { Reader, Book } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');


const resolvers = {

    Query: {

        
        me: async (parent, args, context) => {

            if (context.reader) {
                const info = await Reader.findOne({})
                    .select('-__v -password')
                    .populate('books')

                return info;
            }

            throw new AuthenticationError('Not logged in')

        },

    },

    Mutation: {

        userAddition: async (parent, args) => {
            const reader = await Reader.create(args);
            const authToken = signToken(reader);

            return { authToken, reader };
        },

        login: async (parent, { email, password }) => {
            const reader = await Reader.findOne({ email });

            if (!reader) {
                throw new AuthenticationError('Incorrect email or password');
            }

            const correctPassword = await reader.isCorrectPassword(password);

            if (!correctPassword) {
                throw new AuthenticationError('Incorrect email or password');
            }

            const authToken = signToken(reader);
            return { authToken, reader };

        },

        bookSaving: async (parent, args, context) => {
            if (context.reader) {

                const userUpdate = await Reader.findByIdAndUpdate(
                    { _id: context.reader._id },
                    { $addToSet: { savedBooks: args.input } },
                    { new: true }
                );

                return userUpdate;
            }

            throw new AuthenticationError('Login is required');
        },



        bookDeletion: async (parent, args, context) => {
            if (context.reader) {
                const userUpdate = await Reader.findOneAndUpdate(
                    { _id: context.reader._id },
                    { $pull: { savedBooks: { bookId: args.bookId } } },
                    { new: true }
                );

                return userUpdate;
            }

            throw new AuthenticationError('Login is required');
        }
    }
};

module.exports = resolvers;
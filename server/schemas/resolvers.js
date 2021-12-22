const { User, Book } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');
// const { param } = require('../routes');

const resolvers = {

    Query: {

        //get a enjoyer by enjoyername
        me: async (parent, args, context) => {

            if (context.enjoyer) {
                const info = await User.findOne({})
                    .select('-__v -password')
                    .populate('books')

                return info;
            }

            throw new AuthenticationError('Not logged in')

        },

    },

    Mutation: {

        addUser: async (parent, args) => {
            const enjoyer = await User.create(args);
            const authToken = signToken(enjoyer);

            return { authToken, enjoyer };
        },

        login: async (parent, { email, password }) => {
            const enjoyer = await User.findOne({ email });

            if (!enjoyer) {
                throw new AuthenticationError('Incorrect email or password');
            }

            const correctPassword = await enjoyer.isCorrectPassword(password);

            if (!correctPassword) {
                throw new AuthenticationError('Incorrect email or password');
            }

            const authToken = signToken(enjoyer);
            return { authToken, enjoyer };

        },

        saveBook: async (parent, args, context) => {
            if (context.enjoyer) {

                const userUpdate = await User.findByIdAndUpdate(
                    { _id: context.enjoyer._id },
                    { $addToSet: { savedBooks: args.input } },
                    { new: true }
                );

                return userUpdate;
            }

            throw new AuthenticationError('Login is required');
        },



        removeBook: async (parent, args, context) => {
            if (context.enjoyer) {
                const userUpdate = await User.findOneAndUpdate(
                    { _id: context.enjoyer._id },
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
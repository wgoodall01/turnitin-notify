import {makeExecutableSchema} from 'graphql-tools';

import resolvers from './resolvers.js';

const typeDefs = `
scalar Datetime

type Query {
  # The current user.
  # If null, the user needs to be registered.
  me: User
}

type Mutation {
  createUser(user: UserInput!): User!

  _triggerFetch(id: ID!): [String!]!
}

input UserInput{
  # See 'User'.

  id: ID!
  turnitinEmail: String!
  turnitinPassword: String!
  turnitinTz: String!
  phone: String!
}

type User{
  # Google ID of the user
  id: ID!

  # Turnitin email used to access the account
  turnitinEmail: String!

  # Turnitin password used to access the account
  turnitinPassword: String!

  # Turnitin timezone, to parse datetimes back out to UTC.
  turnitinTz: String!

  # User's phone number, used for SMS notifications.
  phone: String!
  
  # Last time courses were fetched.
  # Null if courses were never fetched.
  updated: Datetime
  
  # Last fetched set of courses.
  # Null if courses were never fetched.
  courses: [Course!]
}


type Course {
  # The Turnitin course ID
  id: ID!
  
  # The name of the course
  name: String! 

  # The course's assignments
  assignments: [Assignment!]!
}

type Assignment {
  # The Turnitin assignment ID
  id: ID!

  # The name of the assignment
  name: String!

  # The similarity score of the assignment, from 0-100
  # If the similarity report hasn't finished yet, it's null.
  similarity: Int

  # If the assignment has been graded yet.
  isGraded: Boolean! 

  # The total number of possible points (points/total)
  total: Int!

  # The number of points given (points/total)
  points: Int!

  # The title of the student's submission
  submissionTitle: String
  
  # The assignment's start date
  start: Datetime!

  # The assignment's due date
  due: Datetime!

  # The assignment's post date
  post: Datetime!
}


`;

const schema = makeExecutableSchema({typeDefs, resolvers});

export default schema;

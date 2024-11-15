import mongoose from 'mongoose';
import {default as User} from "./userModel.mjs";
import bcrypt from "bcrypt";
import zmq from "zeromq";

import {default as credentials} from "./dbCredentials.mjs";

// connect to database
const connection_string = credentials.connection_string;
mongoose.connect(connection_string, {}).catch(err => console.log('Error connecting to MongoDB:', err));

//  ZeroMQ socket setup
const sock = new zmq.Reply();

async function runServer() {

    await sock.bind('tcp://127.0.0.1:5555');
    console.log("Server bound to tcp://127.0.0.1:5555");

    for await (const [msg] of sock) {
        const request = JSON.parse(msg.toString());
        const response = await handleRequest(request);
        await sock.send(JSON.stringify(response));
    }
}

// Handle Incoming Requests
async function handleRequest(request) {
    // what is this about???
    const { login } = request;

    if (login.isNewUser) {
        return await registerUser(login);
    } else {
        return await validateUser(login);
    }
}

// Register a new user
async function registerUser(login) {
    console.log("Running registerUser().........");
    // and this????!
    const { username, password } = login;

    try {
        //Check if the user actually exists
        const existingUser = await User.findOne({ username: username});
        if (existingUser) {
            return {
                isValid: false,
                errorMessage: "User already exists. Please register with a different username"
            }
        }

        // hash password and register the user
        const saltRounds = 10;
        const hashedPass = await bcrypt.hash(password, saltRounds);

        const newUser = new User({username: username, password: hashedPass });

        await newUser.save();

        return {
            isValid: true,
            username: username,
            errorMessage: ""
        };
    } catch (error) {
        console.error("Error during user registration:", error);
        return{
            isValid: false,
            errorMessage: "An error occurred while creating the user."
        };
    }
}

// Validating an existing user
async function validateUser(login) {
    console.log("Running validateUser()................");
    const { username, password } = login;

    try {
        const user = await User.findOne({username: username });
        if (!user) {
            return {
                isValid: false,
                errorMessage: "Invalid username or password",
            };
        }
        
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) {
            return {
                isValid: false,
                errorMessage: "Invalid username or password"
            };
        }

        return {
            isValid: true,
            username: username,
            errorMessage: ""
        };
    } catch (error) {
        console.error("Error during user validation:", error);
        return {
            isValid: false,
            errorMessage: "An error occurred while validating the user."
        };
    }
}

runServer().catch(console.error);

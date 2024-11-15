import zmq from "zeromq";

async function sendTestMessage() {
    const sock = new zmq.Request();

    // connnect to the microservice
    console.log("Attempting to connect to microservice...");
    const microserviceAddress = 'tcp://127.0.0.1:5555';
    sock.connect(microserviceAddress);
    console.log(`Connected to microservice at ${microserviceAddress}`);

    const testMessage = {
        login: {
            username: "testUser",
            password: "testPassword123",
            isNewUser: false
        }
    };

    try {
    // Send the test message
    console.log("Sending message to microservice:", testMessage);
    await sock.send(JSON.stringify(testMessage));

    // Wait for a response
    const [response] = await sock.receive();
    const parsedResponse = JSON.parse(response.toString());
    console.log("Received response from microservice:", parsedResponse);
  } catch (error) {
    console.error("Error during communication with microservice:", error);
  } finally {
    sock.close();
    }
}

sendTestMessage().catch(console.error);